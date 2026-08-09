#!/usr/bin/env bash
# SWUSTFreshmanGuide 部署脚本
# 由 webhook.py 触发: 拉取 main → npm ci → vitepress build → 同步到 /www/wwwroot/<site-domain>

set -euo pipefail

REPO_DIR=/opt/swust-webhook/repo
SITE_DIR=/www/wwwroot/<site-domain>
LOG_PREFIX="[deploy]"
GITHUB_REPO="guiyinrenshi/SWUSTFreshmanGuide"
# 广州服务器实测可用性（多次完整 fetch 平均延迟）
# 1) gh-proxy.com: 0.7s(最快)
# 2) github.com:   1s (原生,故障时易 90s 超时)
# 3) ghfast.top:   2.7s (社区长期维护,稳)
# 优先级: 原生 → gh-proxy → ghfast.top, 任一成功即停
GITHUB_MIRRORS=(
    "https://github.com"
    "https://gh-proxy.com"
    "https://ghfast.top"
)

log() { echo "$LOG_PREFIX $(date '+%Y-%m-%d %H:%M:%S') $*"; }

cd "$REPO_DIR"

# 1. 拉取最新 main（多镜像 fallback）
#    原生 github.com 在国内偶发 90s 超时,3 次重试 = 270s 失败。
#    改为"原生→gh-proxy→ghfast.top"3 段 fallback,每段超时 30s。
#    任意一段成功后,把对应 URL 固化为 origin,后续直接走它
#    (持久化绕过 DNS / 网络抖动)。
log "git fetch with mirror fallback (orig=github.com, mirrors=${GITHUB_MIRRORS[*]})"
FETCH_OK=0
for mirror_base in "${GITHUB_MIRRORS[@]}"; do
    if [ "$mirror_base" = "https://github.com" ]; then
        remote_url="https://github.com/${GITHUB_REPO}.git"
    else
        remote_url="${mirror_base}/https://github.com/${GITHUB_REPO}.git"
    fi
    log "try fetch from: $remote_url"
    # 注意: fetch 失败要继续尝试下一个镜像,不能因 set -e 提前退出
    if timeout 30 git fetch "$remote_url" main --prune 2>&1; then
        FETCH_OK=1
        # 成功:把镜像固化为 origin,后续直接走它
        git remote remove origin 2>/dev/null || true
        git remote add origin "$remote_url"
        log "fetch OK, set origin=$remote_url"
        break
    else
        log "fetch failed from $remote_url (will try next mirror)"
    fi
done
if [ "$FETCH_OK" != "1" ]; then
    log "ERROR: all mirrors failed"
    exit 1
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" = "$REMOTE" ]; then
    log "no new commits, skip deploy (HEAD=$LOCAL)"
    exit 0
fi
log "updating: $LOCAL → $REMOTE"
git reset --hard origin/main
git clean -fdx

# 2. 安装依赖(只装 production + dev,因为 vitepress build 需要)
log "npm ci"
npm ci --no-audit --no-fund 2>&1 | tail -3

# 3. 构建
log "vitepress build"
rm -rf docs/.vitepress/dist docs/.vitepress/cache
npx vitepress build docs 2>&1 | tail -5

# 3.5 确认 pagefind 索引生成且 hash 一致
if [ -f docs/.vitepress/dist/pagefind/pagefind-entry.json ]; then
    log "pagefind index: $(cat docs/.vitepress/dist/pagefind/pagefind-entry.json | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["languages"]["zh-cn"]["hash"], d["languages"]["zh-cn"]["page_count"], "pages")')"
fi

# 4. 验证产物
if [ ! -d docs/.vitepress/dist ]; then
    log "ERROR: dist directory not found"
    exit 1
fi
HTML_COUNT=$(find docs/.vitepress/dist -name "*.html" | wc -l)
log "built $HTML_COUNT HTML pages"

# 5. 同步到 site dir(保留 .user.ini 和 .well-known)
log "sync to $SITE_DIR"
cd "$SITE_DIR"
find . -mindepth 1 -maxdepth 1 \
    ! -name '.user.ini' \
    ! -name '.well-known' \
    -exec rm -rf {} +
cd "$REPO_DIR"
tar -C docs/.vitepress -cf - dist | tar -C "$SITE_DIR" -xf -
mv "$SITE_DIR"/dist/* "$SITE_DIR"/
rmdir "$SITE_DIR"/dist
chown -R www:www "$SITE_DIR" 2>/dev/null || true
log "sync done"

# 6. reload nginx(让 try_files 配置立即生效,虽然 conf 没改)
nginx -s reload 2>&1 || log "WARN: nginx reload failed"

log "DEPLOY SUCCESS"