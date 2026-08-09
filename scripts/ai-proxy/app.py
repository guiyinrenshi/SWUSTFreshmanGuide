"""
SWUSTFreshmanGuide AI 助理后端

最小化 FastAPI 应用,提供 /api/chat 端点
- 配置驱动 provider(支持任意 OpenAI 兼容接口)
- 多 provider fallback: 主 provider 失败(限流/额度不足/超时)时自动切换备用
- 基于站内文章做 RAG(前端把 top-K 文章内容 POST 过来)
- 简单 IP 速率限制
"""
from __future__ import annotations

import asyncio
import logging
import os
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Any

import httpx
import yaml
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# ----------------------------------------------------------------------------
# 配置加载
# ----------------------------------------------------------------------------

CONFIG_PATH = Path(__file__).parent / "config.yaml"

# 环境变量覆盖(方便不暴露到 git 的 key)
ENV_KEY_OVERRIDES = {
    "minimax": "MINIMAX_API_KEY",
    "deepseek": "DEEPSEEK_API_KEY",
    "openai": "OPENAI_API_KEY",
}


def load_config() -> dict[str, Any]:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    # 环境变量覆盖 api_key(且只在 provider 配置了环境变量名时)
    for p in cfg.get("providers", []):
        env_var = ENV_KEY_OVERRIDES.get(p["name"])
        if env_var and os.environ.get(env_var):
            p["api_key"] = os.environ[env_var]
            logging.info(f"provider {p['name']}: api_key from env {env_var}")
    return cfg


def get_active_provider(cfg: dict[str, Any]) -> dict[str, Any]:
    for p in cfg.get("providers", []):
        if p.get("active"):
            return p
    raise RuntimeError("no active provider configured")


def get_provider_by_name(cfg: dict[str, Any], name: str) -> dict[str, Any] | None:
    for p in cfg.get("providers", []):
        if p["name"] == name:
            return p
    return None


# ----------------------------------------------------------------------------
# App + 速率限制
# ----------------------------------------------------------------------------

app = FastAPI(title="swust-ai-proxy", version="0.1.1")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("swust-ai")

cfg = load_config()
active_provider = get_active_provider(cfg)
log.info(f"active provider: {active_provider['name']} model={active_provider['model']}")

# fallback 链: 主 + fallback_order 里的备用
fallback_chain = [active_provider["name"]]
for fb_name in cfg.get("fallback_order", []) or []:
    fb = get_provider_by_name(cfg, fb_name)
    if fb and fb_name not in fallback_chain:
        fallback_chain.append(fb_name)
log.info(f"fallback chain: {fallback_chain}")

# CORS:允许本域(<site-domain>)+ preview(127.0.0.1:4321)+ 任意 origin(限流保护)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# 极简速率限制:IP -> 每小时请求次数(滑动窗口)
_rate_window: dict[str, deque[float]] = defaultdict(deque)


def ratelimit_check(ip: str) -> bool:
    rl = cfg.get("ratelimit", {}) or {}
    if not rl.get("enabled", False):
        return True
    cap = int(rl.get("requests_per_hour", 60))
    now = time.time()
    dq = _rate_window[ip]
    while dq and now - dq[0] > 3600:
        dq.popleft()
    if len(dq) >= cap:
        return False
    dq.append(now)
    return True


# ----------------------------------------------------------------------------
# Request / Response 模型
# ----------------------------------------------------------------------------


class SourceDoc(BaseModel):
    title: str
    path: str
    content: str


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    sources: list[SourceDoc] = Field(default_factory=list)
    history: list[dict[str, str]] = Field(default_factory=list)  # 多轮对话


# ----------------------------------------------------------------------------
# LLM 调用(含 fallback)
# ----------------------------------------------------------------------------


async def call_llm_chat(provider: dict, system: str, messages: list[dict]) -> str:
    """调用 OpenAI 兼容 chat completions。失败抛异常,由上层 fallback。"""
    url = provider["base_url"].rstrip("/") + "/chat/completions"
    headers = {
        "Authorization": f"Bearer {provider['api_key']}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": provider["model"],
        "messages": [{"role": "system", "content": system}] + messages,
        "temperature": provider.get("temperature", 0.3),
        "max_tokens": provider.get("max_tokens", 800),
    }
    timeout = provider.get("timeout", 60)

    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(url, headers=headers, json=payload)
        if r.status_code != 200:
            log.error(f"LLM {provider['name']} {r.status_code}: {r.text[:300]}")
            # 非 2xx 统一抛异常走 fallback
            raise RuntimeError(f"provider {provider['name']} returned {r.status_code}")
        data = r.json()

    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as e:
        raise RuntimeError(f"unexpected LLM response: {e}") from e


def build_prompt(req: ChatRequest) -> tuple[str, list[dict]]:
    """拼 RAG prompt。"""
    cfg_sys = cfg.get("system_prompt", "").strip()

    if not req.sources:
        user_msg = (
            f"## 问题\n{req.question}\n\n"
            "## 站内文章\n(本次未提供站内文章,请直接告知用户「请先在搜索框里搜相关关键词,把文章喂给我再问」)"
        )
    else:
        source_block = "\n\n".join(
            f"[{i+1}] 标题:{s.title}\n路径:{s.path}\n内容:\n{s.content}"
            for i, s in enumerate(req.sources)
        )
        user_msg = (
            f"## 问题\n{req.question}\n\n"
            f"## 站内文章(共 {len(req.sources)} 篇)\n{source_block}\n\n"
            "请基于上述站内文章回答,并用 [[N]] 标注引用。"
        )

    messages = list(req.history) + [{"role": "user", "content": user_msg}]
    return cfg_sys, messages


# ----------------------------------------------------------------------------
# 敏感信息拦截
# ----------------------------------------------------------------------------

import re as _re

# 密钥格式: sk- 后跟 8-64 位字母数字(可含 _ 和 -)
_SENSITIVE_KEY_RE = _re.compile(r"\bsk-[A-Za-z0-9_-]{8,64}\b")
# 其他常见密钥前缀(Bearer token 等)
_SENSITIVE_PREFIXES = (
    "sk-", "sk_", "Bearer ", "api_key=", "apikey=", "token=",
    "AKIA", "ghp_", "gho_", "xoxb-", "xoxp-",
)
# 截断后追加的提示
_TRUNCATE_NOTE = "\n\n> ⚠️ 输出已截断(检测到疑似敏感信息,已自动拦截)。"


def _collect_real_secrets() -> list[str]:
    """收集配置中的真实 key,用于精确匹配(比正则更可靠)。"""
    secrets = set()
    for p in cfg.get("providers", []):
        k = p.get("api_key", "")
        if k and not k.startswith("REPLACE_WITH"):
            secrets.add(k)
            # 同时收集 base_url 中可能带 key 的形态
            if len(k) > 8:
                secrets.add(k[:16])  # key 前缀 16 位
    return list(secrets)


def sanitize_answer(answer: str) -> str:
    """拦截 LLM 输出中的敏感信息:一旦出现疑似密钥,立即截断。

    规则:
    1. 正则匹配 sk-xxx 格式的密钥 → 截断
    2. 精确匹配配置中的真实 key(或其前缀)→ 截断
    3. 匹配其他常见密钥前缀(Bearer/ghp_/AKIA 等)→ 截断
    """
    if not answer:
        return answer

    # 1) 正则: sk- 密钥
    m = _SENSITIVE_KEY_RE.search(answer)
    if m:
        log.warning("sanitize: sk- 密钥模式命中,截断输出")
        return answer[: m.start()].rstrip() + _TRUNCATE_NOTE

    # 2) 精确匹配真实 key
    for secret in _collect_real_secrets():
        idx = answer.find(secret)
        if idx >= 0:
            log.warning("sanitize: 真实 key 命中,截断输出")
            return answer[:idx].rstrip() + _TRUNCATE_NOTE

    # 3) 其他常见密钥前缀(要求后面有足够长的连续 token 字符)
    for prefix in _SENSITIVE_PREFIXES:
        idx = answer.find(prefix)
        if idx >= 0:
            # 检查前缀后面是否紧跟长 token(>=8 位字母数字)
            tail = answer[idx + len(prefix):]
            token_len = 0
            for ch in tail:
                if ch.isalnum() or ch in "_-":
                    token_len += 1
                    if token_len >= 8:
                        break
                else:
                    break
            if token_len >= 8:
                log.warning(f"sanitize: 前缀 '{prefix}' 命中,截断输出")
                return answer[:idx].rstrip() + _TRUNCATE_NOTE

    return answer


async def chat_with_fallback(system: str, messages: list[dict]) -> tuple[str, str]:
    """按 fallback_chain 顺序尝试 provider,返回 (answer, provider_name)。"""
    last_err: Exception | None = None
    for pname in fallback_chain:
        p = get_provider_by_name(cfg, pname)
        if not p or not p.get("api_key") or p["api_key"].startswith("REPLACE_WITH"):
            log.warning(f"provider {pname}: missing api_key, skip")
            continue
        log.info(f"trying provider: {pname} model={p['model']}")
        try:
            answer = await call_llm_chat(p, system, messages)
            # 敏感信息拦截: 一旦输出出现密钥,截断
            answer = sanitize_answer(answer)
            return answer, pname
        except Exception as e:
            last_err = e
            log.error(f"provider {pname} failed: {e}")
            continue
    raise HTTPException(502, f"all providers failed: {last_err}")


# ----------------------------------------------------------------------------
# 端点
# ----------------------------------------------------------------------------


@app.get("/health")
async def health():
    return {
        "ok": True,
        "provider": active_provider["name"],
        "model": active_provider["model"],
        "fallback_chain": fallback_chain,
        "server": f"{cfg['server']['host']}:{cfg['server']['port']}",
    }


@app.post("/api/chat")
async def chat(req: ChatRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    if not ratelimit_check(ip):
        raise HTTPException(429, "rate limit exceeded, try later")

    log.info(f"chat from {ip}, q='{req.question[:60]}', sources={len(req.sources)}")

    system, messages = build_prompt(req)
    answer, used_provider = await chat_with_fallback(system, messages)

    return JSONResponse({
        "answer": answer,
        "provider": used_provider,
        "model": get_provider_by_name(cfg, used_provider)["model"],
        "sources": [s.model_dump() for s in req.sources],
    })


@app.get("/api/chat/stream")
async def chat_stream_not_supported():
    """MVP 暂不支持流式,先用 POST 同步返回。"""
    return JSONResponse(
        {"error": "streaming not implemented in MVP, use POST /api/chat"},
        status_code=501,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=cfg["server"]["host"],
        port=cfg["server"]["port"],
        log_level="info",
    )