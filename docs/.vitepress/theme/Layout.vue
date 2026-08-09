<template>
  <DefaultTheme.Layout>
    <template #nav-bar-content-before>
      <FuseSearch />
    </template>
    <template #nav-bar-content-after>
      <AIChatNavButton />
    </template>
    <template #nav-screen-content-after>
      <AIChatNavButton />
    </template>
    <template #layout-bottom>
      <AIChat />
    </template>
  </DefaultTheme.Layout>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme'
import FuseSearch from '../components/FuseSearch.vue'
import AIChat from '../components/AIChat.vue'
import AIChatNavButton from '../components/AIChatNavButton.vue'
</script>

<style>
/* ========== 导航栏: AI 按钮排在 github 前 ========== */
@media (min-width: 961px) {
  .VPNavBar .content-body {
    flex-wrap: nowrap !important;
  }
  .VPNavBar .social-links {
    order: 10 !important;
  }
  .ai-chat-nav-btn {
    order: 9 !important;
    margin-right: 8px;
  }
}
@media (max-width: 960px) {
  .VPNavBar .content-body {
    overflow: hidden !important;
    min-width: 0 !important;
  }

  /* AI 入口放进汉堡菜单，避免再挤占移动端顶栏。 */
  .VPNavBar .ai-chat-nav-btn {
    display: none !important;
  }
  .VPNavScreen .ai-chat-nav-btn {
    display: inline-flex;
  }
}

/* Hero 入口在常见手机宽度下保持两列等宽。 */
@media (min-width: 320px) and (max-width: 640px) {
  .VPHero .actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }
  .VPHero .actions .action,
  .VPHero .actions .VPButton {
    width: 100%;
  }
}
</style>
