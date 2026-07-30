#!/bin/bash
# ===== 知识卡片管理脚本 =====
# 用法: bash manage.sh [命令]
# 命令: start | stop | restart | status | logs | config | backup | update | uninstall

SERVICE_NAME="knowledge-cards"
INSTALL_DIR="/opt/knowledge-cards"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

CMD="${1:-status}"

case "$CMD" in
  start)
    info "启动服务..."
    systemctl start "$SERVICE_NAME"
    sleep 1
    systemctl is-active --quiet "$SERVICE_NAME" && ok "服务已启动" || error "启动失败"
    ;;
  stop)
    info "停止服务..."
    systemctl stop "$SERVICE_NAME"
    ok "服务已停止"
    ;;
  restart)
    info "重启服务..."
    systemctl restart "$SERVICE_NAME"
    sleep 1
    systemctl is-active --quiet "$SERVICE_NAME" && ok "服务已重启" || error "重启失败"
    ;;
  status)
    echo ""
    systemctl status "$SERVICE_NAME" --no-pager 2>/dev/null || warn "服务未安装"
    echo ""
    # 显示配置
    if [ -f "$INSTALL_DIR/config.json" ]; then
      info "当前配置:"
      cat "$INSTALL_DIR/config.json"
      echo ""
    fi
    # 显示卡片数量
    if [ -f "$INSTALL_DIR/data.json" ]; then
      CARDS=$(grep -o '"id"' "$INSTALL_DIR/data.json" | wc -l)
      info "数据统计: $CARDS 张卡片"
    fi
    ;;
  logs)
    info "实时日志 (Ctrl+C 退出):"
    journalctl -u "$SERVICE_NAME" -f --no-pager
    ;;
  config)
    info "打开配置文件..."
    if command -v nano &> /dev/null; then
      nano "$INSTALL_DIR/config.json"
    elif command -v vi &> /dev/null; then
      vi "$INSTALL_DIR/config.json"
    else
      cat "$INSTALL_DIR/config.json"
      warn "请手动编辑: $INSTALL_DIR/config.json"
    fi
    info "重启服务以应用更改..."
    systemctl restart "$SERVICE_NAME"
    ;;
  backup)
    BACKUP_DIR="${2:-./knowledge-cards-backup-$(date +%Y%m%d)}"
    info "备份到 $BACKUP_DIR ..."
    mkdir -p "$BACKUP_DIR"
    cp "$INSTALL_DIR/data.json" "$BACKUP_DIR/" 2>/dev/null
    cp "$INSTALL_DIR/config.json" "$BACKUP_DIR/" 2>/dev/null
    ok "备份完成: $BACKUP_DIR"
    ls -lh "$BACKUP_DIR/"
    ;;
  update)
    info "更新前端和服务代码..."
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    cp "$SCRIPT_DIR/server.js" "$INSTALL_DIR/"
    cp -r "$SCRIPT_DIR/public/" "$INSTALL_DIR/public/"
    systemctl restart "$SERVICE_NAME"
    sleep 1
    systemctl is-active --quiet "$SERVICE_NAME" && ok "更新完成" || error "更新后启动失败"
    ;;
  uninstall)
    warn "确定要完全卸载知识卡片吗？数据将保留在 $INSTALL_DIR/data.json"
    read -p "输入 yes 确认: " confirm
    if [ "$confirm" = "yes" ]; then
      systemctl stop "$SERVICE_NAME" 2>/dev/null
      systemctl disable "$SERVICE_NAME" 2>/dev/null
      rm -f /etc/systemd/system/${SERVICE_NAME}.service
      systemctl daemon-reload
      info "服务已移除，数据文件保留在 $INSTALL_DIR/"
      warn "如需彻底删除数据: rm -rf $INSTALL_DIR"
      ok "卸载完成"
    else
      info "已取消"
    fi
    ;;
  *)
    echo "用法: bash manage.sh [命令]"
    echo ""
    echo "命令:"
    echo "  start      启动服务"
    echo "  stop       停止服务"
    echo "  restart    重启服务"
    echo "  status     查看状态"
    echo "  logs       查看实时日志"
    echo "  config     编辑配置文件"
    echo "  backup     备份数据 (可选路径参数)"
    echo "  update     更新代码（保留数据）"
    echo "  uninstall  卸载服务（保留数据）"
    ;;
esac
