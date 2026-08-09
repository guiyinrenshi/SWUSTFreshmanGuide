<template>
  <div class="fuse-search">
    <button class="fuse-search-btn" @click="open" aria-label="搜索">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <span class="fuse-search-btn-text">搜索</span>
      <kbd class="fuse-search-btn-kbd">Ctrl K</kbd>
    </button>

    <Teleport to="body">
      <div v-if="visible" class="fuse-search-overlay" @click.self="close">
        <div class="fuse-search-dialog" role="dialog" aria-modal="true">
          <div class="fuse-search-input-wrap">
            <svg class="fuse-search-input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              ref="input"
              v-model="query"
              class="fuse-search-input"
              placeholder="搜索指南内容，如：医保 / 寝室 / 学费"
              @input="doSearch"
              @keydown.esc="close"
              @keydown.down.prevent="moveSel(1)"
              @keydown.up.prevent="moveSel(-1)"
              @keydown.enter.prevent="go"
            />
            <button class="fuse-search-close" @click="close" aria-label="关闭">ESC</button>
          </div>

          <div v-if="query && !results.length" class="fuse-search-empty">空空如也，换个关键词试试</div>

          <ul v-if="results.length" class="fuse-search-results">
            <li
              v-for="(r, i) in results"
              :key="r.path"
              class="fuse-search-result"
              :class="{ active: i === sel }"
              @mouseenter="sel = i"
              @click="go"
            >
              <a :href="r.path">
                <div class="fuse-search-result-title">{{ r.title }}</div>
                <div class="fuse-search-result-snippet">{{ r.content.slice(0, 120) }}</div>
              </a>
            </li>
          </ul>

          <div class="fuse-search-footer">
            <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
            <span><kbd>Enter</kbd> 打开</span>
            <span><kbd>Esc</kbd> 关闭</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Fuse from 'fuse.js'

const visible = ref(false)
const query = ref('')
const results = ref([])
const sel = ref(0)
const input = ref(null)
let fuse = null
let fuseWord = null
let allDocs = []

async function loadIndex() {
  try {
    const resp = await fetch('/search-index.json')
    const pages = await resp.json()
    allDocs = pages
    fuse = new Fuse(pages, {
      keys: ['title', 'content'],
      includeScore: true,
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 1,
    })
    fuseWord = new Fuse(pages, {
      keys: ['title', 'content'],
      includeScore: true,
      threshold: 0.8,
      ignoreLocation: true,
      minMatchCharLength: 1,
    })
  } catch (e) {
    console.warn('search index load failed:', e)
  }
}

function open() {
  visible.value = true
  query.value = ''
  results.value = []
  sel.value = 0
  setTimeout(() => input.value?.focus(), 50)
}

function close() {
  visible.value = false
}

function doSearch() {
  if (!fuse || !query.value.trim()) {
    results.value = []
    return
  }
  // Fuse.js 对中文标点敏感(? 等会破坏匹配),先清洗标点再检索
  const q = query.value
    .replace(/[？?！!。，,、；;：:（）()【】\[\]"'"'"'《》<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!q) {
    results.value = []
    return
  }
  // 整句检索, 0 命中时拆词聚合(复用 AIChat 的检索逻辑)
  let r = fuse.search(q).slice(0, 12)
  if (!r.length) {
    const words = q.split(/\s+/).filter(w => w.length >= 2)
    const agg = new Map()
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
      .slice(0, 12)
    r = ranked.map(x => {
      const doc = allDocs.find(d => d.path === x.path)
      return { score: x.avgScore, item: doc }
    }).filter(x => x.item)
  }
  results.value = r.map(x => x.item)
  sel.value = 0
}

function moveSel(d) {
  if (!results.value.length) return
  sel.value = (sel.value + d + results.value.length) % results.value.length
}

function go() {
  if (results.value[sel.value]) {
    window.location.href = results.value[sel.value].path
    close()
  }
}

function onKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open()
  }
}

onMounted(() => {
  loadIndex()
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.fuse-search {
  margin-left: 16px;
}

.fuse-search-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.fuse-search-btn:hover {
  border-color: var(--vp-c-brand-1);
}
.fuse-search-btn-text {
  margin: 0 4px;
}
.fuse-search-btn-kbd {
  padding: 1px 5px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  font-size: 11px;
  color: var(--vp-c-text-3);
}
.fuse-search-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}
.fuse-search-dialog {
  width: min(620px, 92vw);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: var(--vp-c-bg);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}
.fuse-search-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.fuse-search-input-icon {
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}
.fuse-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: var(--vp-c-text-1);
}
.fuse-search-close {
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  cursor: pointer;
}
.fuse-search-results {
  list-style: none;
  margin: 0;
  padding: 8px;
  overflow-y: auto;
}
.fuse-search-result {
  border-radius: 8px;
}
.fuse-search-result.active {
  background: var(--vp-c-brand-soft);
}
.fuse-search-result a {
  display: block;
  padding: 10px 12px;
  text-decoration: none;
  color: var(--vp-c-text-1);
}
.fuse-search-result-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--vp-c-brand-1);
}
.fuse-search-result-snippet {
  font-size: 12px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}
.fuse-search-empty {
  padding: 40px;
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 14px;
}
.fuse-search-footer {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 11px;
  color: var(--vp-c-text-3);
}
.fuse-search-footer kbd {
  padding: 1px 5px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  margin: 0 2px;
}
</style>
