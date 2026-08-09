#!/usr/bin/env bash
# check-secrets.sh — 提交前敏感信息扫描
# 用法: 在仓库根目录运行  bash scripts/check-secrets.sh
# 退出码 0 = 干净; 1 = 发现敏感信息(阻止提交)
#
# 扫描: 真实服务器 IP / 业务域名 / 密码 / 密钥格式 / 内网 IP 段
# 排除: node_modules / .git / dist / .vitepress/cache

set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

# 敏感模式(按需增删)
PATTERNS=(
  '106\.53\.185\.50'        # 广州服务器真实 IP
  '192\.168\.10\.'          # 本机内网 IP 段
  '10\.10\.'                # 内网 IP 段
  'gyrs\.xyz'               # 业务域名
  'xszn'                    # 站点子域
  'zhang0107'               # 服务器密码
  'sk-cp-'                  # minimax 密钥前缀
  'sk-[A-Za-z0-9_-]{20,}'   # 通用 sk- 密钥
  'ghp_[A-Za-z0-9]{30,}'    # GitHub PAT
)

EXCLUDE='--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=cache --exclude-dir=.vitepress'

found=0
for pat in "${PATTERNS[@]}"; do
  if grep -rInE "$pat" $EXCLUDE --include='*.md' --include='*.sh' --include='*.py' --include='*.js' --include='*.ts' --include='*.vue' --include='*.mts' --include='*.yml' --include='*.yaml' --include='*.json' --include='*.conf' --include='*.env*' --include='*.html' . 2>/dev/null | grep -v 'scripts/check-secrets.sh'; then
    echo "❌ 发现敏感信息: [$pat]"
    found=1
  fi
done

if [ "$found" = "0" ]; then
  echo "✅ 未发现敏感信息,可以提交"
  exit 0
else
  echo ""
  echo "⚠️  检测到敏感信息,请先清理再提交!"
  exit 1
fi