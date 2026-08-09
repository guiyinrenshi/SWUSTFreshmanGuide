// VitePress 主题增强: 在导航栏挂载 Fuse.js 搜索组件 + AI 助理(浮窗+导航入口)
import DefaultTheme from 'vitepress/theme'
import FuseSearch from '../components/FuseSearch.vue'
import AIChat from '../components/AIChat.vue'
import AIChatNavButton from '../components/AIChatNavButton.vue'
import { h } from 'vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // 放回 VitePress 默认搜索框的位置(导航链接后、主题切换前)
      'nav-bar-content-before': () => h(FuseSearch),
      // AI 助理入口按钮: 导航链接后、socialLinks(github)前
      'nav-bar-content-after': () => h(AIChatNavButton),
      // 移动端菜单里的 AI 助理入口
      'nav-screen-content-after': () => h(AIChatNavButton),
      // 全局 AI 助理浮窗(右下角浮动按钮 + 弹窗)
      'layout-bottom': () => h(AIChat),
    })
  },
}
