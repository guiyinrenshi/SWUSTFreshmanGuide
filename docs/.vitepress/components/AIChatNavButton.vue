<!--
  AIChatNavButton.vue — 导航栏 / 移动端菜单里的 AI 助理入口按钮
  点击后触发全局 AIChat 弹窗(window.__openAIChat)
-->
<template>
  <button class="ai-chat-nav-btn" type="button" @click="openChat" aria-label="AI 助理">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/>
      <path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
    </svg>
    <span>AI 助理</span>
  </button>
</template>

<script setup>
function openChat() {
  if (typeof window !== 'undefined' && typeof window.__openAIChat === 'function') {
    window.__openAIChat()
  }
}
</script>

<style scoped>
.ai-chat-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 999px;
  background: transparent;
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
}
.ai-chat-nav-btn:hover {
  background: var(--vp-c-brand-1);
  color: #fff;
}
@media (max-width: 960px) {
  .ai-chat-nav-btn {
    border: none;
    background: transparent;
    color: var(--vp-c-text-1);
    font-size: 14px;
    padding: 8px 4px;
  }
  .ai-chat-nav-btn:hover {
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
  }
}
</style>

<!-- 全局样式(非 scoped): 修复 scoped 无法穿透到 VitePress 内部类的问题 -->
<style>
/* 桌面端: 让 AI 按钮排在 github(social-links)之前
   VitePress content-after slot 默认在 social-links 之后,
   用 flex order 调整: social-links 排后,本按钮排前 */
@media (min-width: 961px) {
  .VPNavBar .content-body {
    flex-wrap: nowrap;
  }
  .VPNavBar .social-links {
    order: 10;
  }
  .ai-chat-nav-btn {
    order: 9;
    margin-right: 8px;
  }
}
</style>