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
}

/* ========== Hero 按钮: 移动端两列网格 + 超小屏全宽 ========== */
@media (max-width: 640px) {
  .VPHero .actions {
    flex-direction: row !important;
    flex-wrap: wrap !important;
    gap: 12px !important;
    justify-content: center !important;
  }
  .VPHero .actions .VPButton {
    width: calc(50% - 6px) !important;
    min-width: 140px !important;
    margin: 0 !important;
  }
  .VPHero .actions .VPButton:last-child:nth-child(odd) {
    width: 100% !important;
  }
}
@media (max-width: 480px) {
  .VPHero .actions .VPButton {
    width: 100% !important;
    min-width: 0 !important;
  }
}

/* ========== Feature 卡片: 填满宽度 ========== */
@media (max-width: 640px) {
  .VPFeatures .VPFeature {
    max-width: 100% !important;
    width: 100% !important;
    margin: 0 0 16px 0 !important;
  }
  .VPFeatures .container {
    padding: 0 16px !important;
  }
  .VPFeatures .VPFeature .box {
    padding: 16px !important;
  }
}
</style>
