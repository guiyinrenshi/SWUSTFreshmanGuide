# scripts/

部署相关的运维脚本与说明。

## deploy.sh

`SWUSTFreshmanGuide` 站点的部署脚本，由 `webhook.py` 在收到 GitHub push 事件后触发。

执行流程：

1. **拉取最新 main**（多镜像 fallback）
   - 原生 `github.com` 在国内机房偶发 90s 超时
   - 改为"原生 → gh-proxy.com → ghfast.top"3 段 fallback
   - 任一段成功后，把对应 URL 固化为 `origin`，后续直接走它（持久化绕过 DNS / 网络抖动）
2. **安装依赖** `npm ci`
3. **构建** `npx vitepress build docs`
4. **同步产物** 到 `/www/wwwroot/<site-domain>`（保留 `.user.ini` / `.well-known`）
5. **reload nginx**

镜像选择依据：在广州服务器（<server-ip>）实测 3 次完整 `git fetch` 的平均延迟：

| 镜像 | 平均延迟 | 备注 |
|---|---|---|
| `gh-proxy.com` | 0.7s | 最快，前缀格式：`https://gh-proxy.com/https://github.com/<owner>/<repo>.git` |
| `github.com` | 1s | 原生，故障时易 90s 超时 |
| `ghfast.top` | 2.7s | 社区长期维护，备用镜像 |

### 服务器端路径

部署脚本实际运行在：

```text
/opt/swust-webhook/deploy.sh
```

本地修改后需要 scp 同步到服务器。修改前会自动备份为 `deploy.sh.bak-pre-mirror-<时间戳>`。

---

## ai-proxy/ — AI 助理后端

为站点右上角"AI 助理"功能提供 RAG 问答能力。

### 架构

```
浏览器  →  <site-domain>/api/chat  →  nginx 反代  →  127.0.0.1:18800 (FastAPI)
                                              →  minimax OpenAI Chat Completions API
```

- 前端用 Fuse.js 在 `search-index.json` 里检索 top-K 文章，连同问题 POST 给 `/api/chat`
- 后端把"问题 + top-K 文章全文"拼成 prompt，调用 LLM（MiniMax-M2.7）流式回答
- LLM 严格遵循 system_prompt：只能基于站内文章回答，必须用 [[N]] 标注引用

### 文件

- `app.py` — FastAPI 主程序
- `config.yaml` — provider / 系统 prompt / 速率限制（**config 入 git，api_key 用环境变量**）
- `swust-ai-proxy.service` — systemd unit 模板（不含真实 key）

### 部署步骤

```bash
# 1. 拷贝文件
scp app.py config.yaml swust-ai-proxy.service root@<server-ip>:/opt/swust-webhook/ai-proxy/

# 2. 安装 systemd unit + env 文件
ssh root@<server-ip> '
  cp /opt/swust-webhook/ai-proxy/swust-ai-proxy.service /etc/systemd/system/swust-ai-proxy.service
  systemctl daemon-reload
  systemctl enable swust-ai-proxy.service
  systemctl start swust-ai-proxy.service
'

# 3. 配置 API key(写入 /etc/swust-webhook/ai-proxy.env,权限 600)
ssh root@<server-ip> 'cat > /etc/swust-webhook/ai-proxy.env << EOF
MINIMAX_API_KEY=sk-<redacted>-...
EOF
chmod 600 /etc/swust-webhook/ai-proxy.env
systemctl restart swust-ai-proxy.service'
```

### 切换 provider

编辑 `config.yaml`：

```yaml
providers:
  - name: "minimax"        # 当前默认
    active: true            # 只允许一个 active: true
    ...
  - name: "deepseek"        # 备用
    active: false           # 改这里 → restart 即切换
    ...
```

**多 provider fallback（v0.1.1+）**：不需要手动改 active。`fallback_order` 定义主 provider 失败时的备用链：

```yaml
fallback_order:
  - "deepseek"
```

主 provider（minimax）因限流 / 额度不足 / 超时失败时，自动按 `fallback_order` 顺序尝试备用 provider。`/api/chat` 响应里的 `provider` 字段会告诉你实际用了谁。

```bash
curl https://<site-domain>/api/health
# {"ok":true,"provider":"minimax","model":"MiniMax-M2.7","fallback_chain":["minimax","deepseek"],...}
```

### 环境变量（key 不入 git）

`/etc/swust-webhook/ai-proxy.env`（权限 600）：

```bash
MINIMAX_API_KEY=sk-<redacted>-...     # minimax 国内站
DEEPSEEK_API_KEY=sk-...       # deepseek 备用
```

改完重启：`systemctl restart swust-ai-proxy.service`

### Nginx 反代

`/api/chat` 和 `/api/health` 已在 `<site-domain>.conf` 中反代到 `127.0.0.1:18800`：

```nginx
location = /api/chat {
    proxy_pass http://127.0.0.1:18800/api/chat;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    ...
}
```

### 速率限制

默认 60 req/h/IP（在 `config.yaml` 的 `ratelimit` 段）。如需调整：

```yaml
ratelimit:
  requests_per_hour: 60
  enabled: true
```

### 监控

```bash
ssh root@<server-ip> 'tail -f /var/log/swust-ai-proxy.log'
```