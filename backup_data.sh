#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────
# backup_data_git.sh
# 定期把 data/ 目录的改动提交到 git，作为本地数据备份。
# 特点：
#   - 自动检测/初始化 git 仓库（仅追踪 data/，不污染项目其他文件）
#   - 只在 data 有改动时才提交，无改动静默跳过
#   - 没有 git 身份时自动设置仓库级本地身份
#   - 可移植：Mac / Linux 通用；可用 DATA_BACKUP_DIR 覆盖仓库路径
# 用法：
#   ./backup_data_git.sh            # 提交脚本所在目录下的 data/
#   DATA_BACKUP_DIR=/path/to/repo ./backup_data_git.sh
# ───────────────────────────────────────────────────────────────
set -euo pipefail
export DATA_BACKUP_DIR="/opt/knowledge-cards-data/"
# 仓库根目录：默认脚本所在目录，允许环境变量覆盖
REPO_DIR="${DATA_BACKUP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
LOG_FILE="$PWD/data-backup.log"

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') $*" | tee -a "$LOG_FILE"
}

cd "$REPO_DIR"

# 3. 仅暂存 data 目录
git add .

# 4. 无改动则跳过
if git diff --cached --quiet; then
  log "data 无改动，跳过提交"
  exit 0
fi

# 5. 提交
MSG="data backup: $(date '+%Y-%m-%d %H:%M:%S')"
git commit -q -m "$MSG"
git push origin main
log "已提交: $MSG"
