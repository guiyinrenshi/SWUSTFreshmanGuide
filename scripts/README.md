# scripts/

部署相关的运维脚本。

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