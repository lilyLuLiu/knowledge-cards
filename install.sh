#!/bin/bash
set -e

# ===== 知识卡片一键安装脚本 =====
# 用法: sudo bash install.sh
# 或:   sudo bash install.sh --port 8080 --password mypass

INSTALL_DIR="/opt/knowledge-cards"
SERVICE_NAME="knowledge-cards"
DEFAULT_PORT=3000

# 颜色输出
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ===== 解析参数 =====
PORT=$DEFAULT_PORT
PASSWORD=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --port) PORT="$2"; shift 2 ;;
    --password) PASSWORD="$2"; shift 2 ;;
    --dir) INSTALL_DIR="$2"; shift 2 ;;
    *) echo "未知参数: $1"; exit 1 ;;
  esac
done

# ===== 检查 root =====
if [ "$EUID" -ne 0 ]; then
  error "请使用 root 权限运行: sudo bash install.sh"
  exit 1
fi

echo ""
echo "============================================"
echo "    🧠 知识卡片 - 一键安装"
echo "============================================"
echo "  安装目录: $INSTALL_DIR"
echo "  端口:     $PORT"
echo "  密码:     ${PASSWORD:-未设置}"
echo "============================================"
echo ""

# ===== 检查/安装 Node.js =====
info "检查 Node.js..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -ge 14 ]; then
    ok "Node.js $(node -v) 已安装"
  else
    warn "Node.js 版本过低 ($(node -v))，需要 v14+"
    info "正在安装 Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi
else
  info "未检测到 Node.js，正在安装..."
  if command -v apt-get &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  elif command -v yum &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
  elif command -v dnf &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    dnf install -y nodejs
  else
    error "无法识别包管理器，请手动安装 Node.js v14+"
    exit 1
  fi
  ok "Node.js $(node -v) 安装完成"
fi

# ===== 停止旧服务 =====
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
  info "停止旧服务..."
  systemctl stop "$SERVICE_NAME" 2>/dev/null || true
fi

# ===== 复制文件 =====
info "安装文件到 $INSTALL_DIR ..."
mkdir -p "$INSTALL_DIR"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp -r "$SCRIPT_DIR"/server.js "$INSTALL_DIR"/
cp -r "$SCRIPT_DIR"/public "$INSTALL_DIR"/
cp -r "$SCRIPT_DIR"/config.json "$INSTALL_DIR"/ 2>/dev/null || true

# 写入配置
cat > "$INSTALL_DIR/config.json" << EOF
{
  "port": $PORT,
  "password": "$PASSWORD",
  "title": "知识卡片"
}
EOF
ok "文件安装完成"

# ===== 创建 systemd 服务 =====
info "创建 systemd 服务..."
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=Knowledge Cards Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
ExecStart=$(which node) ${INSTALL_DIR}/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
ok "系统服务已创建并设置开机自启"

# ===== 启动服务 =====
info "启动服务..."
systemctl start "$SERVICE_NAME"
sleep 2

if systemctl is-active --quiet "$SERVICE_NAME"; then
  ok "服务已启动"
else
  error "服务启动失败，请检查日志: journalctl -u $SERVICE_NAME -f"
  exit 1
fi

# ===== 防火墙 =====
info "检查防火墙..."
if command -v ufw &> /dev/null; then
  ufw allow "$PORT"/tcp 2>/dev/null && ok "ufw 已放行端口 $PORT" || warn "ufw 规则添加失败，请手动放行"
elif command -v firewall-cmd &> /dev/null; then
  firewall-cmd --permanent --add-port="$PORT"/tcp 2>/dev/null
  firewall-cmd --reload 2>/dev/null && ok "firewalld 已放行端口 $PORT" || warn "firewalld 规则添加失败"
else
  warn "未检测到防火墙工具，请确保端口 $PORT 已放行"
fi

# ===== 获取 IP =====
PUBLIC_IP=$(curl -s --connect-timeout 3 ifconfig.me 2>/dev/null || echo "")
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")

# ===== 完成 =====
echo ""
echo "============================================"
echo "    ✅ 安装完成！"
echo "============================================"
echo ""
echo "  📡 本机访问:  http://localhost:$PORT"
if [ -n "$LOCAL_IP" ]; then
  echo "  🖥️  局域网访问: http://$LOCAL_IP:$PORT"
fi
if [ -n "$PUBLIC_IP" ]; then
  echo "  🌍 公网访问:  http://$PUBLIC_IP:$PORT"
fi
if [ -n "$PASSWORD" ]; then
  echo "  🔐 登录密码:  $PASSWORD"
else
  echo "  ⚠️  未设置密码，建议编辑 $INSTALL_DIR/config.json 添加密码后重启"
fi
echo ""
echo "  📋 常用命令:"
echo "     查看状态:  systemctl status $SERVICE_NAME"
echo "     重启服务:  systemctl restart $SERVICE_NAME"
echo "     停止服务:  systemctl stop $SERVICE_NAME"
echo "     查看日志:  journalctl -u $SERVICE_NAME -f"
echo "     修改配置:  nano $INSTALL_DIR/config.json"
echo ""
echo "============================================"
echo ""
