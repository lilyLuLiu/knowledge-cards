const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ===== Config =====
// config.json 位置：可用 CONFIG_DIR 环境变量指定（容器部署时挂载到外部）
const CONFIG_PATH = process.env.CONFIG_DIR
  ? path.join(process.env.CONFIG_DIR, 'config.json')
  : path.join(__dirname, 'config.json');
function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch (e) {
    return { port: 3000, password: '', title: '知识卡片' };
  }
}
const config = loadConfig();
const PORT = process.env.PORT || config.port || 3000;
// 密码优先取环境变量（便于 Docker/容器免挂载注入），回退到 config.json
const PASSWORD = process.env.PASSWORD || config.password || '';
const TITLE = config.title || '知识卡片';

// 数据目录：容器部署时通过 DATA_DIR 指向挂载卷，默认与代码同目录（兼容旧部署）
const DATA_DIR = process.env.DATA_DIR || __dirname;

// ===== AI 设置（造句复习用）=====
// 优先级：环境变量 > config.json > 默认值。API Key 修改后立即生效（不缓存）。
const AI_DEFAULTS = { aiBaseUrl: 'https://api.openai.com/v1', aiModel: 'gpt-4o-mini' };
function getAiSettings() {
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); } catch (e) {}
  return {
    aiApiKey: process.env.AI_API_KEY || cfg.aiApiKey || '',
    aiBaseUrl: (process.env.AI_BASE_URL || cfg.aiBaseUrl || AI_DEFAULTS.aiBaseUrl).replace(/\/+$/, ''),
    aiModel: process.env.AI_MODEL || cfg.aiModel || AI_DEFAULTS.aiModel
  };
}
function updateConfigFile(patch) {
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); } catch (e) {}
  Object.assign(cfg, patch);
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}
function maskKey(key) {
  if (!key) return '';
  if (key.length <= 8) return '••••••';
  return key.slice(0, 4) + '••••••' + key.slice(-4);
}
// 轻量去掉 markdown 符号，作为例句生成的"释义"参考
function plainText(text, maxLen = 150) {
  const s = String(text || '')
    .replace(/[#*_>`~\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s.slice(0, maxLen);
}
// 调用 OpenAI 兼容接口生成例句（含 60s 超时）
async function callAiForSentences(words) {
  const { aiApiKey, aiBaseUrl, aiModel } = getAiSettings();
  if (!aiApiKey) throw new Error('AI_NOT_CONFIGURED');
  const input = words.map(w => ({ id: w.id, word: w.title, meaning: plainText(w.content) }));
  const prompt = `你是英语例句生成器。请为下面的每个单词生成一个英文例句，要求：
1. 每个句子中目标单词只出现一次（可以使用它的常见变形，如时态、复数、词性变化）
2. 除目标单词外，句子中只使用简单常见的英文词汇（初中水平），不要生僻词
3. 句子长度 8~16 个单词，自然通顺
4. 给出句子的完整中文翻译
5. wordForm 填目标单词在句中实际出现的原样形式

输入单词列表：
${JSON.stringify(input)}

输出要求：只输出严格的 JSON 数组，不要 markdown 代码块，不要任何解释文字。格式：
[{"id":123,"word":"单词原形","wordForm":"句中形式","sentence":"英文例句","translation":"中文翻译"}]`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const resp = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiApiKey}` },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: '你是一个严谨的英语例句生成器，只输出 JSON。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8
      }),
      signal: controller.signal
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`AI 接口返回 ${resp.status}：${text.slice(0, 200)}`);
    }
    const json = await resp.json();
    let content = json.choices?.[0]?.message?.content || '';
    content = content.replace(/```json|```/g, '').trim();
    let arr;
    try { arr = JSON.parse(content); } catch (e) {
      const m = content.match(/\[[\s\S]*\]/);
      if (!m) throw new Error('AI 返回格式无法解析');
      arr = JSON.parse(m[0]);
    }
    if (!Array.isArray(arr)) throw new Error('AI 返回格式不正确');
    return arr.map(item => ({
      id: item.id,
      word: String(item.word || ''),
      wordForm: String(item.wordForm || item.word || ''),
      sentence: String(item.sentence || '').trim(),
      translation: String(item.translation || '').trim()
    })).filter(item => item.sentence);
  } finally {
    clearTimeout(timer);
  }
}
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PWA_DIR = path.join(__dirname, 'pwa');

// ===== Data Layer =====
function loadData() {
  try {
    const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (!d.reviewHistory) d.reviewHistory = {};
    if (!d.srsSettings) d.srsSettings = { fastMs: 3000, normalMs: 8000, slowMs: 15000, historyForPersonalization: 20 };
    if (!d.cards) d.cards = [];
    d.cards = d.cards.map(c => ensureSRFields(c));
    return d;
  } catch (e) {
    return { cards: [], customCategories: {}, reviewLogs: {}, streak: { count: 0, lastDate: null }, deletedDefaults: [], reviewHistory: {}, srsSettings: { fastMs: 3000, normalMs: 8000, slowMs: 15000, historyForPersonalization: 20 } };
  }
}

function ensureSRFields(card) {
  if (card.difficulty == null) card.difficulty = 2.5;
  if (card.interval == null) card.interval = 0;
  if (card.nextReviewAt == null) card.nextReviewAt = 0;
  if (card.lastReviewedAt == null) card.lastReviewedAt = 0;
  if (card.repetitions == null) card.repetitions = 0;
  if (card.lapses == null) card.lapses = 0; // 答错累计次数：答错恢复期节奏更慢
  if (card.srsLevel == null) card.srsLevel = 'new'; // new, learning, reviewing, mastered
  return card;
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function seedIfEmpty() {
  const data = loadData();
  if (data.cards.length === 0 && Object.keys(data.reviewLogs).length === 0) {
    const now = Date.now();
    data.cards = [
      { id: now + 1, category: 'english', title: 'Affect vs Effect', content: 'Affect (动词) = 影响\nEffect (名词) = 效果\n\n例句：\nThe weather affects my mood.\nThe effect was immediate.', createdAt: now },
      { id: now + 2, category: 'programming', title: '什么是闭包 (Closure)', content: '闭包是函数和其词法环境的组合。\n\n内层函数可以访问外层函数的变量，即使外层函数已执行完毕。', createdAt: now },
      { id: now + 3, category: 'programming', title: 'HTTP 状态码', content: '1xx - 信息\n2xx - 成功 (200 OK)\n3xx - 重定向 (301, 304)\n4xx - 客户端错误 (404)\n5xx - 服务端错误 (500)', createdAt: now },
      { id: now + 4, category: 'english', title: '常用短语: Break down', content: 'break down = 分解、崩溃、出故障\n\nThe car broke down on the highway.', createdAt: now }
    ];
    saveData(data);
  }
}
seedIfEmpty();

// ===== Auth =====
const TOKENS = new Set();
function checkAuth(req) {
  if (!PASSWORD) return true;
  const auth = req.headers['authorization'];
  if (!auth) return false;
  const token = auth.replace('Bearer ', '');
  return TOKENS.has(token) || token === PASSWORD;
}
function genToken() {
  return crypto.randomBytes(24).toString('hex');
}

// ===== MIME =====
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json'
};

function sendJSON(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// ===== Server =====
const server = http.createServer((req, res) => {
  // ===== CORS（允许分離托管的前端跨域调用 API）=====
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // ===== Login endpoint (no auth required) =====
  if (pathname === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
      if (!PASSWORD) {
        sendJSON(res, 200, { success: true, token: '' });
        return;
      }
      if (body.password === PASSWORD) {
        const token = genToken();
        TOKENS.add(token);
        sendJSON(res, 200, { success: true, token });
      } else {
        sendJSON(res, 401, { success: false, error: '密码错误' });
      }
    });
    return;
  }

  // ===== Check auth for all other API routes =====
  if (pathname.startsWith('/api/') && !checkAuth(req)) {
    sendJSON(res, 401, { error: '未授权', requireAuth: true });
    return;
  }

  // ===== API Routes =====
  if (pathname.startsWith('/api/')) {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let parsed = {};
      if (body) { try { parsed = JSON.parse(body); } catch (e) {} }

      if (pathname === '/api/state' && req.method === 'GET') {
        sendJSON(res, 200, loadData());
        return;
      }

      if (pathname === '/api/cards' && req.method === 'POST') {
        if (!parsed.title || !parsed.content) { sendJSON(res, 400, { error: '标题和内容不能为空' }); return; }
        const data = loadData();
        const card = { id: Date.now(), category: parsed.category || 'other', title: parsed.title, content: parsed.content, createdAt: Date.now() };
        data.cards.push(card); saveData(data);
        sendJSON(res, 200, card);
        return;
      }

      const putMatch = pathname.match(/^\/api\/cards\/(\d+)$/);
      if (putMatch && req.method === 'PUT') {
        const id = parseInt(putMatch[1]);
        const data = loadData();
        const card = data.cards.find(c => c.id === id);
        if (!card) { sendJSON(res, 404, { error: 'not found' }); return; }
        if (parsed.category) card.category = parsed.category;
        if (parsed.title) card.title = parsed.title;
        if (parsed.content) card.content = parsed.content;
        card.updatedAt = Date.now(); saveData(data);
        sendJSON(res, 200, card);
        return;
      }

      const delMatch = pathname.match(/^\/api\/cards\/(\d+)$/);
      if (delMatch && req.method === 'DELETE') {
        const id = parseInt(delMatch[1]);
        const data = loadData();
        data.cards = data.cards.filter(c => c.id !== id);
        saveData(data);
        sendJSON(res, 200, { success: true });
        return;
      }

      const masteredMatch = pathname.match(/^\/api\/cards\/(\d+)\/mastered$/);
      if (masteredMatch && req.method === 'PATCH') {
        const id = parseInt(masteredMatch[1]);
        const data = loadData();
        const card = data.cards.find(c => c.id === id);
        if (!card) { sendJSON(res, 404, { error: 'not found' }); return; }
        card.mastered = parsed.mastered === true || parsed.mastered === undefined ? !card.mastered : parsed.mastered;
        saveData(data);
        sendJSON(res, 200, { success: true, mastered: card.mastered });
        return;
      }

      const importantMatch = pathname.match(/^\/api\/cards\/(\d+)\/important$/);
      if (importantMatch && req.method === 'PATCH') {
        const id = parseInt(importantMatch[1]);
        const data = loadData();
        const card = data.cards.find(c => c.id === id);
        if (!card) { sendJSON(res, 404, { error: 'not found' }); return; }
        card.important = parsed.important === true || parsed.important === undefined ? !card.important : parsed.important;
        saveData(data);
        sendJSON(res, 200, { success: true, important: card.important });
        return;
      }

      if (pathname === '/api/categories' && req.method === 'POST') {
        const data = loadData();
        data.customCategories[parsed.key] = { name: parsed.name, color: parsed.color };
        saveData(data);
        sendJSON(res, 200, { success: true });
        return;
      }

      const delCatMatch = pathname.match(/^\/api\/categories\/(.+)$/);
      if (delCatMatch && req.method === 'DELETE') {
        const key = decodeURIComponent(delCatMatch[1]);
        const data = loadData();
        const defaultKeys = ['english','programming','math','science','history','language','other'];
        if (defaultKeys.includes(key)) {
          if (!data.deletedDefaults) data.deletedDefaults = [];
          if (!data.deletedDefaults.includes(key)) data.deletedDefaults.push(key);
        } else {
          delete data.customCategories[key];
        }
        // 找一个 fallback 分类（第一个未被删除的）
        const remaining = defaultKeys.filter(k => !(data.deletedDefaults || []).includes(k) && k !== key);
        const customKeys = Object.keys(data.customCategories);
        const fallback = remaining[0] || customKeys[0] || 'other';
        data.cards.forEach(c => { if (c.category === key) c.category = fallback; });
        saveData(data);
        sendJSON(res, 200, { success: true, cards: data.cards, customCategories: data.customCategories, deletedDefaults: data.deletedDefaults || [] });
        return;
      }

      if (pathname === '/api/categories/restore' && req.method === 'POST') {
        const data = loadData();
        data.deletedDefaults = [];
        saveData(data);
        sendJSON(res, 200, { success: true });
        return;
      }

      const revMatch = pathname.match(/^\/api\/review\/(\d+)$/);
      if (revMatch && req.method === 'POST') {
        const id = parseInt(revMatch[1]);
        const data = loadData();
        const today = new Date().toDateString();
        if (!data.reviewLogs[today]) data.reviewLogs[today] = [];
        if (!data.reviewLogs[today].includes(id)) data.reviewLogs[today].push(id);
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (data.streak.lastDate !== today) {
          if (data.streak.lastDate === yesterday) data.streak.count += 1;
          else data.streak.count = 1;
          data.streak.lastDate = today;
        }
        // 如果前端传来 SRS 数据则更新卡片状态
        if (parsed && parsed.srs) {
          const card = data.cards.find(c => c.id === id);
          if (card) {
            ensureSRFields(card);
            if (parsed.srs.difficulty != null) card.difficulty = parsed.srs.difficulty;
            if (parsed.srs.interval != null) card.interval = parsed.srs.interval;
            if (parsed.srs.nextReviewAt != null) card.nextReviewAt = parsed.srs.nextReviewAt;
            if (parsed.srs.repetitions != null) card.repetitions = parsed.srs.repetitions;
            if (parsed.srs.lapses != null) card.lapses = parsed.srs.lapses;
            if (parsed.srs.stability != null) card.stability = parsed.srs.stability;
            if (parsed.srs.srsLevel) card.srsLevel = parsed.srs.srsLevel;
            card.lastReviewedAt = parsed.srs.lastReviewedAt != null ? parsed.srs.lastReviewedAt : Date.now();
            // 记录复习历史
            if (!data.reviewHistory[id]) data.reviewHistory[id] = [];
            data.reviewHistory[id].push({
              at: Date.now(),
              correct: parsed.srs.correct,
              responseMs: parsed.srs.responseMs,
              actualDays: parsed.srs.actualDays,
              baseScore: parsed.srs.baseScore,
              finalScore: parsed.srs.finalScore,
              quality: parsed.srs.quality,
              newInterval: parsed.srs.interval,
              newDifficulty: parsed.srs.difficulty,
              mode: parsed.srs.mode || 'flip'
            });
            // 个性化阈值：累计足够历史样本后，用 P50 作为 normalMs，P25 作为 fastMs，P75 作为 slowMs
            const allHist = Object.values(data.reviewHistory).flat().filter(h => h.correct);
            if (allHist.length >= (data.srsSettings.historyForPersonalization || 20)) {
              const rts = allHist.map(h => h.responseMs).sort((a, b) => a - b);
              const p25 = rts[Math.floor(rts.length * 0.25)];
              const p50 = rts[Math.floor(rts.length * 0.50)];
              const p75 = rts[Math.floor(rts.length * 0.75)];
              data.srsSettings.fastMs = Math.max(1500, Math.min(6000, p25));
              data.srsSettings.normalMs = Math.max(4000, Math.min(12000, p50));
              data.srsSettings.slowMs = Math.max(8000, Math.min(25000, p75));
            }
          }
        }
        saveData(data);
        const respCard = data.cards.find(c => c.id === id);
        sendJSON(res, 200, { success: true, streak: data.streak, srsSettings: data.srsSettings, card: respCard || null });
        return;
      }

      // SRS 设置更新
      if (pathname === '/api/srs/settings' && req.method === 'POST') {
        const data = loadData();
        if (!data.srsSettings) data.srsSettings = { fastMs: 3000, normalMs: 8000, slowMs: 15000, historyForPersonalization: 20 };
        if (parsed.fastMs) data.srsSettings.fastMs = parsed.fastMs;
        if (parsed.normalMs) data.srsSettings.normalMs = parsed.normalMs;
        if (parsed.slowMs) data.srsSettings.slowMs = parsed.slowMs;
        saveData(data);
        sendJSON(res, 200, { success: true, srsSettings: data.srsSettings });
        return;
      }

      // 复习历史查询
      const histMatch = pathname.match(/^\/api\/srs\/history\/(\d+)$/);
      if (histMatch && req.method === 'GET') {
        const id = parseInt(histMatch[1]);
        const data = loadData();
        sendJSON(res, 200, { history: data.reviewHistory?.[id] || [] });
        return;
      }

      if (pathname === '/api/import' && req.method === 'POST') {
        let imported = parsed.data ? parsed.data : parsed;
        if (!imported || !Array.isArray(imported.cards)) {
          sendJSON(res, 400, { error: '备份文件格式不正确' });
          return;
        }
        const mode = (parsed.mode === 'merge') ? 'merge' : 'replace';
        const data = loadData();
        if (mode === 'merge') {
          const map = new Map(data.cards.map(c => [c.id, c]));
          imported.cards.forEach(c => {
            if (map.has(c.id)) map.set(c.id, ensureSRFields({ ...map.get(c.id), ...c }));
            else map.set(c.id, ensureSRFields(c));
          });
          data.cards = [...map.values()];
          if (imported.customCategories) Object.assign(data.customCategories, imported.customCategories);
          if (imported.reviewLogs) {
            Object.keys(imported.reviewLogs).forEach(d => {
              const set = new Set(data.reviewLogs[d] || []);
              imported.reviewLogs[d].forEach(id => set.add(id));
              data.reviewLogs[d] = [...set];
            });
          }
          if (imported.reviewHistory) {
            if (!data.reviewHistory) data.reviewHistory = {};
            Object.keys(imported.reviewHistory).forEach(cid => {
              data.reviewHistory[cid] = [...(data.reviewHistory[cid] || []), ...(imported.reviewHistory[cid] || [])];
            });
          }
          if (imported.srsSettings) {
            data.srsSettings = { ...(data.srsSettings || {}), ...imported.srsSettings };
          }
          if (imported.deletedDefaults) {
            const set = new Set(data.deletedDefaults || []);
            imported.deletedDefaults.forEach(k => set.add(k));
            data.deletedDefaults = [...set];
          }
          if (imported.streak) {
            const s1 = data.streak || { count: 0, lastDate: null };
            const s2 = imported.streak || { count: 0, lastDate: null };
            if (!s1.lastDate || (s2.lastDate && new Date(s2.lastDate) > new Date(s1.lastDate))) {
              data.streak = s2;
            } else if (s1.lastDate === s2.lastDate) {
              data.streak = { count: Math.max(s1.count || 0, s2.count || 0), lastDate: s1.lastDate };
            }
          }
        } else {
          data.cards = (imported.cards || []).map(c => ensureSRFields(c));
          data.customCategories = imported.customCategories || {};
          data.reviewLogs = imported.reviewLogs || {};
          data.reviewHistory = imported.reviewHistory || {};
          data.srsSettings = imported.srsSettings || { fastMs: 3000, normalMs: 8000, slowMs: 15000, historyForPersonalization: 20 };
          data.streak = imported.streak || { count: 0, lastDate: null };
          data.deletedDefaults = imported.deletedDefaults || [];
        }
        // 备份旧数据，便于回滚
        try { fs.writeFileSync(DATA_FILE + '.bak', JSON.stringify(data, null, 2), 'utf-8'); } catch (e) {}
        saveData(data);
        sendJSON(res, 200, { success: true, mode, cardCount: data.cards.length });
        return;
      }

      // ===== AI 设置（造句复习）=====
      if (pathname === '/api/ai/settings' && req.method === 'GET') {
        const ai = getAiSettings();
        sendJSON(res, 200, {
          configured: !!ai.aiApiKey,
          aiBaseUrl: ai.aiBaseUrl,
          aiModel: ai.aiModel,
          apiKeyMasked: maskKey(ai.aiApiKey)
        });
        return;
      }

      if (pathname === '/api/ai/settings' && req.method === 'POST') {
        const patch = {};
        // apiKey 传空字符串表示不修改；显式传 '-' 表示清除
        if (typeof parsed.aiApiKey === 'string' && parsed.aiApiKey !== '') {
          patch.aiApiKey = parsed.aiApiKey.trim() === '-' ? '' : parsed.aiApiKey.trim();
        }
        if (typeof parsed.aiBaseUrl === 'string' && parsed.aiBaseUrl.trim()) patch.aiBaseUrl = parsed.aiBaseUrl.trim();
        if (typeof parsed.aiModel === 'string' && parsed.aiModel.trim()) patch.aiModel = parsed.aiModel.trim();
        updateConfigFile(patch);
        const ai = getAiSettings();
        sendJSON(res, 200, { success: true, configured: !!ai.aiApiKey, apiKeyMasked: maskKey(ai.aiApiKey) });
        return;
      }

      // AI 批量生成例句（造句复习）
      if (pathname === '/api/ai/sentences' && req.method === 'POST') {
        const words = Array.isArray(parsed.words) ? parsed.words.filter(w => w && w.title) : [];
        if (words.length === 0) { sendJSON(res, 400, { error: '缺少要生成例句的单词列表' }); return; }
        (async () => {
          try {
            const sentences = await callAiForSentences(words);
            sendJSON(res, 200, { sentences });
          } catch (e) {
            if (e.message === 'AI_NOT_CONFIGURED') {
              sendJSON(res, 400, { error: 'AI 未配置，请先在设置中配置 API Key', requireAiSetup: true });
            } else if (e.name === 'AbortError') {
              sendJSON(res, 504, { error: 'AI 生成超时，请重试' });
            } else {
              sendJSON(res, 500, { error: e.message || 'AI 生成失败' });
            }
          }
        })();
        return;
      }

      sendJSON(res, 404, { error: 'not found' });
    });
    return;
  }

  // ===== PWA Shell (same-origin, served from /pwa/) =====
  // 让 iOS/Android 可通过“添加到主屏幕”安装为 App，首次打开填服务器地址，之后自动加载应用
  if (pathname === '/pwa' || pathname.startsWith('/pwa/')) {
    let rel = pathname.slice('/pwa'.length);
    if (!rel || rel.endsWith('/')) rel = '/index.html';
    const pwaPath = path.join(PWA_DIR, rel);
    fs.readFile(pwaPath, (err, content) => {
      if (err) {
        fs.readFile(path.join(PWA_DIR, 'index.html'), (err2, content2) => {
          if (err2) { res.writeHead(404); res.end('Not Found'); return; }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content2);
        });
        return;
      }
      const ext = path.extname(pwaPath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(content);
    });
    return;
  }

  // ===== Static Files =====
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(PUBLIC_DIR, filePath);
  fs.readFile(filePath, (err, content) => {
    if (err) {
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, content2) => {
        if (err2) { res.writeHead(404); res.end('Not Found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content2);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🧠 ${TITLE}服务已启动！`);
  console.log(`\n📡 本机访问:  http://localhost:${PORT}`);
  console.log(`🌍 外网访问:  http://<服务器IP>:${PORT}`);
  console.log(`📲 PWA 入口:  http://<服务器IP>:${PORT}/pwa/  （手机浏览器打开后可“添加到主屏幕”安装为 App）`);
  console.log(`🔐 密码保护:  ${PASSWORD ? '已启用' : '未启用（建议在 config.json 中设置密码）'}`);
  console.log(`\n按 Ctrl+C 停止服务\n`);
});
