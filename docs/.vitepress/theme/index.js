// VitePress 主题增强: 在导航栏挂载 Fuse.js 搜索组件
import DefaultTheme from 'vitepress/theme'
import FuseSearch from '../components/FuseSearch.vue'
import { h } from 'vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(FuseSearch),
    })
  },
}
