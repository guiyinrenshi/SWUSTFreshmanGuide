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
</style>
