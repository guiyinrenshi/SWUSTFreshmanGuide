<!--
  AIChat.vue — 站内 RAG 问答浮窗
  - 右下角浮动按钮,点击弹出对话框
  - 前端先做 Fuse.js 检索,把 top-5 文章作为 sources 喂给后端
  - 后端基于 sources 严格回答,带 [[N]] 引用
-->
<template>
  <div class="ai-chat">
    <button
      v-if="!visible"
      class="ai-chat-fab"
      @click="open"
      aria-label="打开 AI 助理"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/>
        <path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
      </svg>
      <span>AI 助理</span>
    </button>

    <Teleport to="body">
      <div v-if="visible" class="ai-chat-overlay" @click.self="close">
        <div class="ai-chat-dialog" role="dialog" aria-modal="true">
          <header class="ai-chat-header">
            <div>
              <strong>西南科大新生指南 · AI 助理</strong>
              <div class="ai-chat-sub">基于站内 39 篇文章 · 由 MiniMax-M2.7 驱动</div>
            </div>
            <button class="ai-chat-close" @click="close" aria-label="关闭">ESC</button>
          </header>

          <div ref="msgsEl" class="ai-chat-messages">
            <div v-if="!messages.length" class="ai-chat-hint">
              <p>试试这些问题:</p>
              <button v-for="(q, i) in examples" :key="i" class="ai-chat-example" @click="ask(q)">
                {{ q }}
              </button>
            </div>

            <div v-for="(m, i) in messages" :key="i" :class="['ai-chat-msg', `ai-chat-msg-${m.role}`]">
              <div class="ai-chat-msg-label">{{ m.role === 'user' ? '你' : 'AI' }}</div>
              <div class="ai-chat-msg-body" v-html="renderMarkdown(m.content)"></div>
              <details v-if="m.role === 'ai' && m.sources?.length" class="ai-chat-sources">
                <summary>参考资料 ({{ m.sources.length }} 篇)</summary>
                <ul>
                  <li v-for="(s, j) in m.sources" :key="j">
                    <a :href="s.path" target="_blank">[{{ j + 1 }}] {{ s.title || s.path }}</a>
                  </li>
                </ul>
              </details>
            </div>

            <div v-if="loading" class="ai-chat-msg ai-chat-msg-ai">
              <div class="ai-chat-msg-label">AI</div>
              <div class="ai-chat-msg-body ai-chat-typing">
                <span></span><span></span><span></span>
              </div>
            </div>

            <div v-if="error" class="ai-chat-error">{{ error }}</div>
          </div>

          <form class="ai-chat-input-row" @submit.prevent="send">
            <input
              v-model="input"
              class="ai-chat-input"
              placeholder="例如:医保怎么办理?需要多少钱?"
              :disabled="loading"
              maxlength="500"
              @keydown.enter.exact.prevent="send"
            />
            <button class="ai-chat-send" :disabled="loading || !input.trim()" type="submit">发送</button>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import Fuse from 'fuse.js'

const visible = ref(false)
const input = ref('')
const messages = ref([])
const loading = ref(false)
const error = ref('')
const msgsEl = ref(null)

let fuse = null
let fuseWord = null
let allDocs = []

const examples = [
  '医保怎么办理?需要多少钱?',
  '寝室怎么选?有什么建议?',
  '转专业看哪些成绩?需要考试吗?',
]

// ESC 关闭(只在客户端注册,避开 SSR)
function onKeydown(e) {
  if (e.key === 'Escape' && visible.value) close()
}
onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})

async function loadIndex() {
  if (fuse) return
  try {
    const resp = await fetch('/search-index.json')
    allDocs = await resp.json()
    fuse = new Fuse(allDocs, {
      keys: ['title', 'content'],
      includeScore: true,
      threshold: 0.6,   // 整句检索阈值
      ignoreLocation: true,
      minMatchCharLength: 1,
    })
    fuseWord = new Fuse(allDocs, {
      keys: ['title', 'content'],
      includeScore: true,
      threshold: 0.8,   // 拆词检索阈值(2字词需要更宽松)
      ignoreLocation: true,
      minMatchCharLength: 1,
    })
  } catch (e) {
    console.warn('ai-chat search index load failed:', e)
  }
}

// Fuse.js 对中文标点敏感(? 等会破坏匹配),先清洗标点
function cleanQuery(q) {
  return (q || '')
    .replace(/[？?！!。，,、；;：:（）()【】\[\]"'"'"'《》<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// 拆词: 去掉纯语气虚词,保留关键信息词(名词/动词)
function splitWords(q) {
  const stopwords = ['怎么', '什么', '如何', '请问', '一个', '一下', '可以', '应该', '要吗', '吗', '呢', '的', '了', '在', '是', '我', '你', '他', '这个', '那个', '有']
  const words = q.split(/\s+/).filter(w => w.length >= 2)
  const filtered = words.filter(w => !['怎么', '什么', '如何', '请问', '可以', '应该', '多少', '需要', '有什'].includes(w))
  return filtered.length ? filtered : words
}

function retrieve(question, k = 5) {
  if (!fuse) return []
  const q = cleanQuery(question)
  if (!q) return []

  // 1) 整句检索
  let results = fuse.search(q).slice(0, k)
  if (results.length) {
    return results.map(r => ({
      title: r.item.title || '',
      path: r.item.path || '',
      content: (r.item.content || '').slice(0, 800),
    }))
  }

  // 2) 拆词聚合: 对每个词单独检索,按命中词数+平均分排序
  const words = splitWords(q)
  const agg = new Map() // path -> {hits:Set, totalScore}
  for (const w of words) {
    const wr = fuseWord.search(w).slice(0, 15)
    for (const x of wr) {
      const p = x.item.path
      if (!agg.has(p)) agg.set(p, { hits: new Set(), totalScore: 0 })
      const s = agg.get(p)
      s.hits.add(w)
      s.totalScore += x.score
    }
  }
  const ranked = Array.from(agg.entries())
    .map(([path, s]) => ({ path, hitCount: s.hits.size, avgScore: s.totalScore / s.hits.size }))
    .sort((a, b) => (b.hitCount - a.hitCount) || (a.avgScore - b.avgScore))
    .slice(0, k)

  return ranked.map(x => {
    const doc = allDocs.find(d => d.path === x.path)
    return {
      title: doc?.title || '',
      path: doc?.path || '',
      content: (doc?.content || '').slice(0, 800),
    }
  })
}

async function open() {
  visible.value = true
  await loadIndex()
  setTimeout(() => document.querySelector('.ai-chat-input')?.focus(), 50)
}

function close() {
  visible.value = false
}

async function ask(q) {
  input.value = q
  await send()
}

async function send() {
  const q = input.value.trim()
  if (!q || loading.value) return
  error.value = ''
  messages.value.push({ role: 'user', content: q })
  input.value = ''
  loading.value = true
  await nextTick()
  scrollToBottom()

  const sources = retrieve(q, 5)

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, sources }),
    })
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`)
    }
    const data = await resp.json()
    messages.value.push({
      role: 'ai',
      content: data.answer || '(空回答)',
      sources: data.sources || [],
    })
  } catch (e) {
    error.value = `请求失败:${e.message || e}。请稍后重试或联系管理员。`
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

function scrollToBottom() {
  if (msgsEl.value) {
    msgsEl.value.scrollTop = msgsEl.value.scrollHeight
  }
}

function renderMarkdown(text) {
  // 极简渲染:处理 [[N]] 引用 + 段落换行 + 链接
  return (text || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\[\[(\d+)\]\]/g, '<sup class="ai-cite">[$1]</sup>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^/, '<p>').replace(/$/, '</p>')
    .replace(/### (.*)/g, '<h4>$1</h4>')
    .replace(/## (.*)/g, '<h3>$1</h3>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n- /g, '\n<li>')
    .replace(/(<li>[^]*?)(?=\n[^<]|$)/g, '$1</li>')
}

// (ESC 关闭监听已移到 onMounted/onBeforeUnmount)
</script>

<style scoped>
.ai-chat-fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 999;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 999px;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,.15);
  transition: all .2s;
}
.ai-chat-fab:hover {
  background: var(--vp-c-brand-2);
  transform: translateY(-1px);
}

.ai-chat-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.ai-chat-dialog {
  width: 100%;
  max-width: 720px;
  height: min(80vh, 700px);
  background: var(--vp-c-bg);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0,0,0,.25);
}
.ai-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.ai-chat-sub {
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin-top: 2px;
}
.ai-chat-close {
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 11px;
  cursor: pointer;
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px;
}
.ai-chat-hint {
  text-align: center;
  color: var(--vp-c-text-2);
  padding: 20px 0;
}
.ai-chat-hint p { margin-bottom: 12px; font-size: 13px; }
.ai-chat-example {
  display: block;
  width: 100%;
  max-width: 360px;
  margin: 6px auto;
  padding: 8px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}
.ai-chat-example:hover { background: var(--vp-c-brand-soft); border-color: var(--vp-c-brand-1); }

.ai-chat-msg {
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.65;
}
.ai-chat-msg-user {
  background: var(--vp-c-brand-soft);
  border: 1px solid var(--vp-c-brand-1);
}
.ai-chat-msg-ai {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}
.ai-chat-msg-label {
  font-size: 11px;
  color: var(--vp-c-text-3);
  margin-bottom: 4px;
}
.ai-chat-msg-body { color: var(--vp-c-text-1); }
.ai-chat-msg-body h3, .ai-chat-msg-body h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 8px 0 4px;
}
.ai-chat-msg-body p { margin: 6px 0; }
.ai-cite {
  color: var(--vp-c-brand-1);
  font-size: 11px;
  font-weight: 600;
  background: var(--vp-c-brand-soft);
  padding: 1px 4px;
  border-radius: 3px;
  margin: 0 2px;
}

.ai-chat-sources {
  margin-top: 8px;
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.ai-chat-sources summary {
  cursor: pointer;
  padding: 4px 0;
}
.ai-chat-sources ul { padding-left: 16px; margin: 4px 0; }
.ai-chat-sources a { color: var(--vp-c-brand-1); }

.ai-chat-typing { display: inline-flex; gap: 4px; padding: 4px 0; }
.ai-chat-typing span {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
  animation: ai-dot 1.4s infinite;
}
.ai-chat-typing span:nth-child(2) { animation-delay: .2s; }
.ai-chat-typing span:nth-child(3) { animation-delay: .4s; }
@keyframes ai-dot {
  0%, 80%, 100% { opacity: .3; transform: scale(.8); }
  40% { opacity: 1; transform: scale(1); }
}

.ai-chat-error {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.ai-chat-input-row {
  display: flex;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid var(--vp-c-divider);
}
.ai-chat-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
}
.ai-chat-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}
.ai-chat-send {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}
.ai-chat-send:disabled {
  background: var(--vp-c-text-3);
  cursor: not-allowed;
}
</style>