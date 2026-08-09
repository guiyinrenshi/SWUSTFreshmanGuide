// VitePress 主题增强: 在导航栏挂载 Fuse.js 搜索组件 + 全局 AI 助理浮窗
import DefaultTheme from 'vitepress/theme'
import FuseSearch from '../components/FuseSearch.vue'
import AIChat from '../components/AIChat.vue'
import { h } from 'vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // 放回 VitePress 默认搜索框的位置(导航链接后、主题切换前)
      'nav-bar-content-before': () => h(FuseSearch),
      // 全局 AI 助理浮窗(右下角浮动按钮)
      'layout-bottom': () => h(AIChat),
    })
  },
}
