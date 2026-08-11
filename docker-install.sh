#!/bin/bash
set -e

#######################################
#  知识卡片 · Docker 一键部署脚本
#######################################
# 用法:
#   sudo bash docker-install.sh
#   sudo bash docker-install.sh --port 8080 --password mypass
#   sudo bash docker-install.sh --data-dir /mnt/kc-data --name kc
#
# 说明:
#   - 脚本所在目录需包含 Dockerfile / server.js / public / pwa
#   - 镜像名默认 knowledge-cards，容器名默认 knowledge-cards
#   - 数据持久化在 <data-dir>（默认 /opt/knowledge-cards-data），挂载到容器 /data
#   - 容器内固定监听 3000，主机通过 -p <port>:3000 映射
#   - 重新运行本脚本会重建容器，数据卷保持不变，不会丢失

IMAGE_NAME="knowledge-cards"
CONTAINER_NAME="knowledge-cards"
DEFAULT_PORT=3000
DEFAULT_DATA_DIR="/opt/knowledge-cards-data"
PASSWORD=""

# 颜色输出
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ===== 解析参数 =====
PORT=$DEFAULT_PORT
DATA_DIR=$DEFAULT_DATA_DIR
while [[ $# -gt 0 ]]; do
  case $1 in
    --port) PORT="$2"; shift 2 ;;
    --password) PASSWORD="$2"; shift 2 ;;
    --data-dir) DATA_DIR="$2"; shift 2 ;;
    --image) IMAGE_NAME="$2"; shift 2 ;;
    --name) CONTAINER_NAME="$2"; shift 2 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^#\s\?//'
      exit 0 ;;
    *) error "未知参数: $1"; exit 1 ;;
  esac
done

echo ""
echo "============================================"
echo "    🐳 知识卡片 · Docker 部署"
echo "============================================"
echo "  镜像名:   $IMAGE_NAME"
echo "  容器名:   $CONTAINER_NAME"
echo "  主机端口: $PORT  ->  容器 3000"
echo "  数据目录: $DATA_DIR"
echo "  密码:     ${PASSWORD:-未设置}"
echo "============================================"
echo ""

# ===== 检查 Docker =====
info "检查 Docker..."
if ! command -v docker &> /dev/null; then
  error "未检测到 Docker，请先安装: https://docs.docker.com/get-docker/"
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  error "Docker 守护进程未运行或当前用户无权限，请确认 docker 可用（例如：sudo usermod -aG docker \$USER 后重新登录）"
  exit 1
fi
ok "Docker 可用 ($(docker --version))"

# ===== 构建镜像 =====
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
info "在 $SCRIPT_DIR 构建镜像 $IMAGE_NAME ..."
docker build -t "$IMAGE_NAME" "$SCRIPT_DIR"
ok "镜像构建完成"

# ===== 停止旧容器 =====
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  info "停止并移除旧容器 $CONTAINER_NAME ..."
  docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
  docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true
fi

# ===== 创建数据目录 =====
mkdir -p "$DATA_DIR"
ok "数据目录就绪: $DATA_DIR"

# ===== 运行容器 =====
info "启动容器 $CONTAINER_NAME ..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "${PORT}:3000" \
  -e "PASSWORD=${PASSWORD}" \
  -v "${DATA_DIR}:/data" \
  "$IMAGE_NAME" >/dev/null

# 等待启动
sleep 2
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  ok "容器已启动"
else
  error "容器启动失败，请查看日志: docker logs $CONTAINER_NAME"
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
echo "    ✅ Docker 部署完成！"
echo "============================================"
echo ""
echo "  📡 本机访问:  http://localhost:$PORT"
if [ -n "$LOCAL_IP" ]; then
  echo "  🖥️  局域网访问: http://$LOCAL_IP:$PORT"
fi
if [ -n "$PUBLIC_IP" ]; then
  echo "  🌍 公网访问:  http://$PUBLIC_IP:$PORT"
fi
echo "  📲 PWA 入口:  http://<服务器IP>:$PORT/pwa/  （手机浏览器打开后可「添加到主屏幕」安装为 App）"
if [ -n "$PASSWORD" ]; then
  echo "  🔐 登录密码:  $PASSWORD"
else
  echo "  ⚠️  未设置密码，建议用 --password 或编辑 data 目录配置后重启容器"
fi
echo ""
echo "  🐳 常用命令:"
echo "     查看状态:  docker ps"
echo "     查看日志:  docker logs -f $CONTAINER_NAME"
echo "     重启容器:  docker restart $CONTAINER_NAME"
echo "     停止容器:  docker stop $CONTAINER_NAME"
echo "     更新部署:  重新运行本脚本即可（自动重建容器，数据保留在 $DATA_DIR）"
echo ""
echo "============================================"
echo ""
