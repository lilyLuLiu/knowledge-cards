const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ===== Config =====
const CONFIG_PATH = path.join(__dirname, 'config.json');
function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch (e) {
    return { port: 3000, password: '', title: '知识卡片' };
  }
}
const config = loadConfig();
const PORT = process.env.PORT || config.port || 3000;
const PASSWORD = config.password || '';
const TITLE = config.title || '知识卡片';

const DATA_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// ===== Data Layer =====
function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    return { cards: [], customCategories: {}, reviewLogs: {}, streak: { count: 0, lastDate: null }, deletedDefaults: [] };
  }
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
  '.jpg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};

function sendJSON(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// ===== Server =====
const server = http.createServer((req, res) => {
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
        saveData(data);
        sendJSON(res, 200, { success: true, reviewLogs: data.reviewLogs, streak: data.streak });
        return;
      }

      sendJSON(res, 404, { error: 'not found' });
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
  console.log(`🔐 密码保护:  ${PASSWORD ? '已启用' : '未启用（建议在 config.json 中设置密码）'}`);
  console.log(`\n按 Ctrl+C 停止服务\n`);
});
