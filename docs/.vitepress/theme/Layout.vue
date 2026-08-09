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
@media (min-width: 961px) {
  .VPNavBar .content-body {
    flex-wrap: nowrap !important;
    gap: 12px !important;
  }
  .VPNavBar .social-links {
    padding-inline: 8px !important;
    gap: 8px !important;
  }
  .ai-chat-nav-btn {
    margin-left: auto !important;
    padding: 6px 16px !important;
    min-height: 32px !important;
    font-size: 13px !important;
  }
  .VPNavBar .social-links > a {
    width: 32px !important;
    height: 32px !important;
    border-radius: 8px !important;
  }
  .VPNavBarAppearance {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    padding-inline: 12px 28px !important;
  }
  .VPNavBarAppearance button {
    margin-inline: auto !important;
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
