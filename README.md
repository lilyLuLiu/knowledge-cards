# 🧠 知识卡片 (Knowledge Cards)

一个轻量级、零依赖的知识卡片应用，支持分类管理、多种复习模式、发音朗读，可部署在任意 Linux 服务器上，手机/电脑同步使用。

## ✨ 功能特性

### 卡片管理
- **分类管理**：内置英语、编程、数学、科学、历史、语言、其他 7 个默认分类，支持自定义新增/删除分类
- **随时添加**：快速添加知识点卡片，每张卡片包含标题（知识点）和内容（释义）
- **编辑/删除**：随时修改或删除已有卡片
- **分类颜色**：每个分类有独立颜色标识，卡片列表按分类颜色区分显示
- **Markdown 支持**：卡片内容支持 Markdown 格式，可使用标题、粗体、斜体、代码块、列表、引用等语法，在卡片列表、复习翻卡、默写答案、听写释义、PDF 导出中均自动渲染

### 复习系统
- **翻卡模式** 🃏：看问题，点击翻转看答案，经典闪卡体验
- **默写模式** ✍️：看卡片背面（释义），手写对应的知识点，提交后自动对比评判
- **听写模式** 🎧：仅通过发音（TTS 语音合成）听写知识点，适合英语拼写练习
- **复习设置**：
  - 分类多选：选择要复习的一个或多个分类
  - 已学会筛选：全部 / 仅未学会 / 仅已学会
  - 重点筛选：全部 / 仅重点 / 仅非重点
  - 复习数目：自定义每次复习卡片数量
  - 排序方式：随机 / 顺序（新→旧）/ 倒序（旧→新）
- **默认设置**：打开复习默认选择「英语」「未学会」「随机」
- **评判标准**：默写和听写模式要求 100% 完全一致才算正确
- **重新回答**：默写/听写模式回答错误后，可修改输入内容重新提交（输入框保持可用）
- **复习快捷键**：
  - 翻卡模式：空格键翻转卡片，回车键下一张，←/→ 上一张/下一张
  - 默写/听写模式：回车键提交答案，Shift+回车换行，回答正确后回车键下一张

### 其他功能
- **发音朗读** 🔊：英语卡片使用英文 TTS 朗读，其他卡片使用中文 TTS
- **已学会标记** ✅：可将卡片标记为已学会，复习时可筛选
- **重点标记** ⭐：可将卡片标记为重点，复习时可筛选。与已学会标记使用不同颜色区分
- **三色标签区分**：已学会（绿色）、今日已复习（蓝色）、重点（橙色），互不重叠
- **卡片筛选排序**：列表页支持按已学会状态筛选、按重点状态筛选、按时间正序/倒序排列
- **连续打卡**：记录每日复习情况，统计连续复习天数
- **PDF 导出** 📄：可选择分类导出卡片为 PDF 文件
- **密码保护** 🔐：支持设置访问密码，保护隐私
- **深色模式** 🌙：支持亮色/深色主题切换

## 📝 Markdown 语法支持

卡片内容（背面/释义）支持 Markdown 格式，在所有显示位置自动渲染为富文本。

### 支持的语法

| 语法 | 示例 | 效果 |
|------|------|------|
| 标题 | `## 二级标题` | 加粗大号文字 |
| 粗体 | `**文字**` | **文字** |
| 斜体 | `*文字*` | *文字* |
| 行内代码 | `` `代码` `` | `代码` |
| 代码块 | ` ```python \n print('hi') \n ``` ` | 带背景的代码块 |
| 无序列表 | `- 项目一` | • 项目一 |
| 有序列表 | `1. 第一步` | 1. 第一步 |
| 引用 | `> 引用内容` | 缩进引用块 |
| 分割线 | `---` | 水平分割线 |
| 链接 | `[文字](URL)` | 可点击链接 |

### 使用示例

添加卡片时，在"内容/答案"框中使用 Markdown：

```
## 区别总结

**Affect**（动词）= 影响
- 例：The weather *affects* my mood.

**Effect**（名词）= 效果
- 例：The medicine had a positive *effect*.

> 记忆口诀：RAVEN — **R**emember, **A**ffect = **V**erb, **E**ffect = **N**oun
```

> 纯文本内容（不含 Markdown 语法）仍然正常显示，完全兼容。

## 📦 项目结构

```
knowledge-cards-deploy/
├── server.js          # 后端服务（零依赖，仅使用 Node.js 内置模块）
├── public/
│   └── index.html     # 前端单文件应用（HTML + CSS + JS）
├── config.json        # 配置文件（端口、密码、标题）
├── data.json          # 数据文件（自动生成，存储所有卡片和设置）
├── install.sh         # 一键安装脚本
├── manage.sh          # 管理脚本（启动/停止/备份/更新/卸载）
└── README.md          # 说明文档
```

## 🚀 快速安装

### 环境要求
- Linux 服务器（Ubuntu / CentOS / Debian 等均可）
- Node.js v14+（安装脚本会自动检测并安装）
- root 权限

### 一键安装

```bash
# 解压部署包
tar xzf knowledge-cards-deploy.tar.gz
cd knowledge-cards-deploy

# 一键安装（默认端口 3000，无密码）
sudo bash install.sh

# 或指定端口和密码
sudo bash install.sh --port 8080 --password yourpassword
```

安装脚本会自动完成以下操作：
1. 检测并安装 Node.js（如未安装或版本过低）
2. 复制文件到 `/opt/knowledge-cards/`
3. 创建 systemd 系统服务并设置开机自启
4. 启动服务
5. 放行防火墙端口

安装完成后，根据终端输出的地址即可访问：
- 本机访问：`http://localhost:端口`
- 局域网访问：`http://内网IP:端口`
- 公网访问：`http://公网IP:端口`

## ⚙️ 配置说明

配置文件位于 `/opt/knowledge-cards/config.json`：

```json
{
  "port": 3000,
  "password": "",
  "title": "知识卡片"
}
```

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `port` | 服务监听端口 | `3000` |
| `password` | 访问密码，留空则无密码保护 | `""` |
| `title` | 页面标题 | `知识卡片` |

### 修改配置

```bash
# 方法一：使用管理脚本（编辑后自动重启）
bash manage.sh config

# 方法二：手动编辑
nano /opt/knowledge-cards/config.json
systemctl restart knowledge-cards
```

### 设置密码

```bash
# 编辑配置文件，将 password 改为你的密码
nano /opt/knowledge-cards/config.json
# 修改为: "password": "你的密码"

# 重启服务生效
systemctl restart knowledge-cards
```

## 💾 数据存储

### 存储位置

所有数据存储在 `/opt/knowledge-cards/data.json` 文件中，采用 JSON 格式。

### 数据结构

```json
{
  "cards": [
    {
      "id": 1690000000001,
      "category": "english",
      "title": "Affect vs Effect",
      "content": "## 区别\n**Affect**（动词）= 影响\n**Effect**（名词）= 效果\n\n> 记忆口诀：RAVEN",
      "createdAt": 1690000000001,
      "updatedAt": 1690000000002,
      "mastered": false,
      "important": false
    }
  ],
  "customCategories": {
    "mycategory": { "name": "自定义分类", "color": "#e17055" }
  },
  "reviewLogs": {
    "Thu Jul 30 2026": [1690000000001, 1690000000002]
  },
  "streak": {
    "count": 5,
    "lastDate": "Thu Jul 30 2026"
  },
  "deletedDefaults": []
}
```

| 字段 | 说明 |
|------|------|
| `cards` | 所有卡片数组，每张卡片含 id、分类、标题、内容、创建时间、是否已学会、是否重点 |
| `customCategories` | 用户自定义分类 |
| `reviewLogs` | 每日复习记录，按日期分组记录已复习的卡片 ID |
| `streak` | 连续复习天数统计 |
| `deletedDefaults` | 已删除的默认分类列表 |

### 数据备份

```bash
# 使用管理脚本备份
bash manage.sh backup

# 备份到指定目录
bash manage.sh backup /path/to/backup

# 手动备份
cp /opt/knowledge-cards/data.json ~/data-backup-$(date +%Y%m%d).json
```

## 📋 管理命令

使用管理脚本 `manage.sh` 进行日常管理：

```bash
bash manage.sh [命令]
```

| 命令 | 说明 |
|------|------|
| `start` | 启动服务 |
| `stop` | 停止服务 |
| `restart` | 重启服务 |
| `status` | 查看服务状态、配置和数据统计 |
| `logs` | 查看实时日志（Ctrl+C 退出） |
| `config` | 编辑配置文件（保存后自动重启） |
| `backup` | 备份数据（可选指定路径） |
| `update` | 更新代码（保留数据） |
| `uninstall` | 卸载服务（保留数据文件） |

也可以直接使用 systemctl 命令：

```bash
systemctl status knowledge-cards     # 查看状态
systemctl restart knowledge-cards    # 重启服务
systemctl stop knowledge-cards       # 停止服务
journalctl -u knowledge-cards -f     # 查看日志
```

## 🔄 更新升级

当有新版本时，更新步骤：

```bash
# 1. 解压新的部署包
tar xzf knowledge-cards-deploy.tar.gz
cd knowledge-cards-deploy

# 2. 使用管理脚本更新（自动保留数据）
sudo bash manage.sh update

# 或手动更新代码文件
sudo cp public/index.html /opt/knowledge-cards/public/
sudo cp server.js /opt/knowledge-cards/
sudo systemctl restart knowledge-cards
```

> ⚠️ **重要**：如果新版本包含后端变更（如新增 API 端点），必须同时更新 `server.js` 和 `public/index.html`。只更新前端文件会导致部分功能报错。
>
> 更新操作只替换代码文件，不会影响 `data.json` 中的数据。

## 📱 手机使用

服务部署后，手机和电脑可通过浏览器访问同一地址，数据实时同步：

1. 确保手机与服务器在同一网络下，或服务器有公网 IP
2. 手机浏览器访问 `http://服务器IP:端口`
3. 输入密码（如已设置）即可使用

所有操作（添加卡片、复习、标记学会等）在手机和电脑间实时同步。

## 🔧 技术说明

- **后端**：纯 Node.js 内置模块（http、fs、path、crypto），零外部依赖
- **前端**：单 HTML 文件，内含全部 CSS 和 JavaScript
- **数据持久化**：JSON 文件存储，无需数据库
- **语音合成**：使用浏览器原生 SpeechSynthesis API，无需额外服务
- **进程管理**：systemd 服务，支持开机自启和自动重启

### API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/state` | 获取所有数据（卡片、分类、复习记录等） |
| `POST` | `/api/login` | 登录验证（返回 token） |
| `POST` | `/api/cards` | 添加卡片 |
| `PUT` | `/api/cards/:id` | 编辑卡片 |
| `DELETE` | `/api/cards/:id` | 删除卡片 |
| `PATCH` | `/api/cards/:id/mastered` | 切换已学会状态 |
| `PATCH` | `/api/cards/:id/important` | 切换重点状态 |
| `POST` | `/api/categories` | 新增分类 |
| `DELETE` | `/api/categories/:key` | 删除分类 |
| `POST` | `/api/categories/restore` | 恢复已删除的默认分类 |
| `POST` | `/api/review/:id` | 记录卡片复习 |

## ❓ 常见问题

**Q: 如何修改端口？**
A: 编辑 `/opt/knowledge-cards/config.json` 中的 `port` 字段，然后 `systemctl restart knowledge-cards`。同时记得放行新端口的防火墙。

**Q: 忘记密码怎么办？**
A: 在服务器上编辑 `config.json`，将 `password` 改为空或新密码，重启服务即可。

**Q: 数据会丢失吗？**
A: 所有数据存储在 `data.json` 中。更新代码不会影响数据。建议定期使用 `manage.sh backup` 备份。

**Q: 支持多少张卡片？**
A: JSON 文件存储，万张以内无性能问题。更多建议定期导出 PDF 归档。

**Q: 发音不工作？**
A: 发音依赖浏览器的 SpeechSynthesis API。请使用 Chrome、Edge、Safari 等现代浏览器。部分 Linux 服务器环境可能缺少语音引擎，但手机和电脑浏览器通常都支持。

**Q: 标记重点/已学会失败提示"服务器未更新"？**
A: 说明服务器上的 `server.js` 版本过旧，缺少对应的 API 端点。请同时更新 `server.js` 和 `public/index.html` 后重启服务。
