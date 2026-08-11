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
- **数据备份与迁移** 📦：一键导出全部数据为 JSON 备份文件，可导入到任意平台的实例，方便跨设备/跨服务器迁移
- **密码保护** 🔐：支持设置访问密码，保护隐私
- **深色模式** 🌙：支持亮色/深色主题切换
- **PWA 安装** 📲：内置 PWA 壳（`/pwa/`），iPhone/Android 可"添加到主屏幕"作为独立 App 全屏使用（HTTP / HTTPS 均可，纯 HTTP 即可安装）
- **首次填写服务器地址** 🔗：PWA 壳首次打开时填写服务器地址（默认已填同源地址，一键保存），之后自动连接，App 内可随时用 ⚙ 重新配置

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
├── pwa/               # PWA 安装壳（由同源 /pwa/ 提供）
├── config.json        # 配置文件（端口、密码、标题）
├── data.json          # 数据文件（自动生成，存储所有卡片和设置）
├── Dockerfile         # Docker 镜像构建文件
├── docker-install.sh  # Docker 一键部署脚本
├── install.sh         # 一键安装脚本（systemd 方式）
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

---

## 🐳 Docker 部署（容器化）

如果你希望用容器方式运行（无需在服务器上安装 Node.js、升级/回滚更干净、环境隔离），可以使用内置的 `Dockerfile` 与一键脚本 `docker-install.sh`。

### 环境要求
- 一台已安装 Docker 的 Linux 服务器（Docker Engine 20+）
- root 权限（或当前用户在 `docker` 组中）

### 一键部署

```bash
# 解压部署包
tar xzf knowledge-cards-deploy.tar.gz
cd knowledge-cards-deploy

# 默认端口 3000、无密码
sudo bash docker-install.sh

# 指定主机端口和密码（容器内固定监听 3000，通过 -p 映射）
sudo bash docker-install.sh --port 8080 --password yourpassword

# 指定数据持久化目录（默认 /opt/knowledge-cards-data）
sudo bash docker-install.sh --data-dir /mnt/kc-data --port 8080
```

脚本会自动完成：
1. 检测 Docker 是否可用
2. 在脚本目录构建镜像 `knowledge-cards`（基于 `node:20-alpine`，零 npm 依赖，镜像很小）
3. 停止并移除同名旧容器（如有）
4. 创建数据目录并挂载为容器 `/data` 卷（数据持久化，重建容器不丢）
5. 以 `--restart unless-stopped` 启动容器，主机端口映射到容器 3000
6. 放行防火墙端口

### 容器配置（端口 / 密码 / 数据）

| 项 | 参数 / 环境变量 | 说明 |
|----|------|------|
| 主机端口 | `docker-install.sh --port <端口>` | 映射到容器内固定 3000 |
| 访问密码 | `docker-install.sh --password <密码>` | 通过环境变量 `PASSWORD` 注入，无需改文件 |
| 数据目录 | `docker-install.sh --data-dir <目录>` | 挂载到容器 `/data`，容器内 `data.json` 写在此处 |
| 监听端口（容器内） | 环境变量 `PORT` | 默认 3000，一般不需要改 |

> 也可用环境变量 `CONFIG_DIR` 指向挂载的配置文件目录（默认读取镜像内 `/app/config.json`）。

### 手动 Docker 命令

```bash
# 构建镜像
docker build -t knowledge-cards .

# 运行容器（端口映射 + 密码 + 数据卷）
docker run -d \
  --name knowledge-cards \
  --restart unless-stopped \
  -p 3000:3000 \
  -e PASSWORD=yourpassword \
  -v /opt/knowledge-cards-data:/data \
  knowledge-cards
```

### 容器常用命令

```bash
docker ps                              # 查看运行状态
docker logs -f knowledge-cards         # 查看日志
docker restart knowledge-cards         # 重启
docker stop knowledge-cards           # 停止
docker rm -f knowledge-cards          # 删除容器（数据卷保留）
```

### 升级 / 回滚

重新运行 `sudo bash docker-install.sh` 即可：脚本会重新构建镜像、用**同一个数据卷**重建容器，**数据不会丢失**。如需回滚，用旧版本部署包重新构建镜像即可。

### 数据备份

Docker 部署下，数据全部在挂载卷（默认 `/opt/knowledge-cards-data/data.json`）中，直接复制该文件即可：

```bash
cp /opt/knowledge-cards-data/data.json ~/kc-backup-$(date +%Y%m%d).json
```

也可在应用内使用「📦 导出数据」功能（见上方「应用内数据导出 / 导入」）。

---

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

- **systemd 部署**：数据文件位于 `/opt/knowledge-cards/data.json`
- **Docker 部署**：数据文件位于挂载卷目录（默认 `/opt/knowledge-cards-data/data.json`，即容器内 `/data/data.json`）

均采 JSON 格式，结构相同。

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

### 应用内数据导出 / 导入（推荐用于迁移）

应用主界面「操作栏」提供两个按钮，无需登录服务器即可完成迁移：

- **📦 导出数据**：将全部数据（卡片、自定义分类、复习记录、连续打卡、已删除默认分类）打包为带时间戳的 JSON 文件下载到本地。备份文件格式为 `{ app, version, exportedAt, data: {...} }`。
- **📥 导入数据**：选择备份文件后，可选择两种导入方式：
  - **替换全部**（默认）：用备份数据完全覆盖当前实例，适合"从旧服务器迁移到新服务器"。
  - **合并保留**：按卡片 ID 合并，已有卡片更新、新卡片追加；自定义分类、复习记录、连续打卡、已删除分类均做并集，适合"多端数据汇总"。
  - 导入前会自动将当前数据备份为 `data.json.bak`，如需回滚可手动恢复该文件。

> 导入功能需要后端 `server.js` 提供 `POST /api/import` 接口。更新时请同时替换 `server.js` 与 `public/index.html` 后重启服务。

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

## 📲 手机安装为 App（PWA）

应用内置了一个 PWA 壳（`/pwa/` 目录，由同一个 node 服务同源提供）。它像原生 App 一样可"安装"到手机主屏幕，全屏运行、带独立图标，并且**首次打开时填写一次服务器地址，之后自动连接**。

> 💡 **不需要 HTTPS 也能装**。本应用采用与「参考工作台」相同的方案：靠 `apple-mobile-web-app-capable` + `apple-touch-icon` 这套 HTML 标签让 iOS **在 HTTP 下**就把网页「添加到主屏幕」变成全屏 App 图标（无浏览器地址栏）。Service Worker（离线壳）只在 HTTPS 下生效，HTTP 下会静默跳过，**不影响安装与使用**。所以 `http://服务器IP:3000/pwa/` 直接就能用。

### 部署后怎么用（纯 HTTP，局域网即可）

整个部署包（含 `server.js` / `public/` / `pwa/`）部署到服务器并启动后：

1. 手机（与服务器同一 WiFi，或服务有公网 IP）浏览器打开 **`http://服务器IP:3000/pwa/`**（注意路径带 `/pwa/`）
2. 首次打开会显示设置页，已自动填好**同源地址**（`http://服务器IP:3000`），直接点「保存并打开」即可；也可以改成任何其他能访问到的服务器地址（如另一台 `http://内网IP:3000` 或公网 `https://...`）
3. 之后进入就是知识卡片应用，地址已记住；想换服务器可点应用内右上角 **⚙** 重新配置

### iPhone / iPad（iOS Safari）

1. 用 Safari 打开 **`http://服务器IP:3000/pwa/`**
2. 点击底部工具栏的 **分享按钮**（⬆ 方框箭头）
3. 向下滑动，选择 **「添加到主屏幕」**
4. 可改名称后点「添加」
5. 主屏出现「知识卡片」图标，点开即**以独立 App 全屏运行**（无 Safari 地址栏）

> iOS 没有自动弹出的"安装提示"，需手动走「分享 → 添加到主屏幕」。此方式在 HTTP 与 HTTPS 下均可。

### Android（Chrome / Edge）

- **HTTP 下**：点右上角菜单 → **「添加到主屏幕」**，生成书签式全屏图标（可用）。
- **HTTPS 下（可选）**：地址栏右侧会出现 **「安装应用」** 图标，安装为真正的 PWA（带离线壳、可放到应用抽屉）。

### 工作原理

- `pwa/index.html`：PWA 壳，内含首次设置页与 🧠 图标；用 `<iframe>` 加载真实应用，**URL 由壳控制**（默认同源），应用本身无需关心服务器地址
- `pwa/manifest.webmanifest`：定义应用名、图标、全屏（`display: standalone`）、主题色
- `pwa/service-worker.js`：缓存 PWA 壳（首页/图标），让壳可离线打开；真实应用数据始终实时走网络（**仅 HTTPS 生效，HTTP 下自动跳过**）
- `pwa/icons/`：192/512 图标，含 `maskable`，供 iOS/Android 安装图标
- 关键 meta 标签：`apple-mobile-web-app-capable` + `apple-touch-icon` 是 iOS **HTTP 也能全屏安装**的核心

> 根目录 `public/` 也自带 `manifest.webmanifest` / `sw.js` / `icon.png`，所以直接以 **HTTPS 打开根地址 `/`** 同样可以"添加到主屏幕"，两种方式任选。

## ☁️ （可选）套一层 HTTPS

基础安装**不需要** HTTPS。仅在你想获得以下增强时才需要在这层 HTTP 外面包一个 HTTPS：

- Android 地址栏的「安装应用」原生提示（而非菜单里的「添加到主屏幕」）
- PWA 离线打开外壳（断网也能进设置页）
- 把应用暴露到**任意网络**（不局限于同一 WiFi / 公网 IP）

### 方式一：Cloudflare 隧道（免费、无需买证书，推荐用于公网访问）

把 `http://localhost:3000` 通过 Cloudflare 隧道暴露为带浏览器信任证书的 HTTPS 地址：

```bash
# 服务器上安装 cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# 临时隧道（一行命令，得 https://xxxx.trycloudflare.com，重启会变地址）
cloudflared tunnel --url http://localhost:3000
```

- **固定地址（推荐）**：注册一个便宜/免费域名（如 `.xyz`/`.top`，或免费二级域名 `eu.org`），把 NS 托管到 Cloudflare，建一个固定隧道（`cloudflared tunnel create kc` 等），CNAME 指向隧道，得到固定的 `https://cards.你的域名.com`。手机永久可装，任意网络都能访问。

### 方式二：Nginx 反向代理 + 证书

- 有域名：用 Certbot（Let's Encrypt 免费自动证书）反代 `127.0.0.1:3000`
- 无域名仅内网：用 `openssl` 自签证书，Nginx 监听 443 反代本机 3000；**iOS 需手动信任证书**（设置 → 通用 → 关于本机 → 证书信任设置）

### 装好后

浏览器打开 `https://你的HTTPS地址/pwa/` → 首次填服务器地址（默认同源）→ 安装为 App。数据全部实时走你自己的服务器。

> 后端 `server.js` 已内置 CORS，若你确实把前端与后端分开部署在不同域名，也能正常跨域调用 API。

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
| `POST` | `/api/import` | 导入备份数据（body 含 `data` 与 `mode`：`replace` 或 `merge`） |

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
