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

/* ========== Hero 按钮: 移动端全宽竖排 ========== */
@media (max-width: 640px) {
  .VPHero .actions {
    flex-direction: column !important;
    align-items: stretch !important;
    width: 100% !important;
  }
  .VPHero .actions .VPButton {
    width: 100% !important;
    justify-content: center !important;
  }
}

/* ========== Feature 卡片: 移动端单列, 消除右侧留白 ========== */
@media (max-width: 640px) {
  .VPFeatures .VPFeature {
    max-width: 100% !important;
  }
}
</style>
