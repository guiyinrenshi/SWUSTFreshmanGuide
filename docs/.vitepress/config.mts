import { defineConfig } from 'vitepress'

// 站点配置 — 西南科大新生指南
// 原始 markdown 全部保留在 docs/ 子目录下，未做任何重命名或移动
export default defineConfig({
  lang: 'zh-CN',
  title: '西南科大新生指南',
  titleTemplate: ':title — 西南科大新生指南',
  description: '由西南科技大学经济管理学院归隐人士撰写并维护的非官方新生入学指南。',
  cleanUrls: true,
  lastUpdated: true,
  // 原仓库历史里有部分图片相对路径写错(图片其实在 照片/ 子目录但 md 引用的是 ./xxx),
  // GitHub 直接浏览这些页面本来就看不到图。忽略死链/死图,不阻断 build。
  ignoreDeadLinks: true,

  // GitHub Pages 部署配置
  // 用户名 guiyinrenshi, 仓库 SWUSTFreshmanGuide, 站点访问地址:
  // https://guiyinrenshi.github.io/SWUSTFreshmanGuide/
  // 如果之后切到自定义域名,在 srcDir 下放一个 CNAME 文件即可
  head: [
    ['meta', { name: 'theme-color', content: '#1f6feb' }],
    ['meta', { property: 'og:title', content: '西南科大新生指南' }],
    ['meta', { property: 'og:description', content: '西南科技大学非官方新生入学指南,补充和完善学校新生手册。' }],
    ['meta', { property: 'og:type', content: 'website' }],
  ],

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      {
        text: '指南',
        items: [
          { text: '西南科大新生指南', link: '/西南科大新生指南/前言' },
          { text: '西山校区生活', link: '/西山校区生活指南/住在西山' },
          { text: '青义校区生活', link: '/青义校区生活指南/食在青义' },
        ],
      },
      {
        text: '资源',
        items: [
          { text: 'GitHub 仓库', link: 'https://github.com/guiyinrenshi/SWUSTFreshmanGuide' },
          { text: '提 Issue', link: 'https://github.com/guiyinrenshi/SWUSTFreshmanGuide/issues' },
        ],
      },
    ],

    sidebar: {
      // 三个独立分组各自一个侧边栏
      '/西南科大新生指南/': [
        {
          text: '入门',
          items: [
            { text: '前言', link: '/西南科大新生指南/前言' },
            { text: '拿到录取通知书后要做的事', link: '/西南科大新生指南/拿到录取通知书后要做的事' },
            { text: '学校的地理分区以及地图', link: '/西南科大新生指南/学校的地理分区以及地图' },
          ],
        },
        {
          text: '预报到 · 信息填写',
          collapsed: false,
          items: [
            { text: '填写前的准备工作', link: '/西南科大新生指南/填写前的准备工作' },
            { text: '待填写信息预览', link: '/西南科大新生指南/待填写信息预览' },
            { text: '生源地、籍贯、家庭地址、通信地址和收件人', link: '/西南科大新生指南/生源地，籍贯，家庭地址，通信地址和收件人相关' },
            { text: '人数怎么填', link: '/西南科大新生指南/人数怎么填' },
            { text: '行程都没确定怎么填?', link: '/西南科大新生指南/行程都没确定怎么就让我填行程？' },
            { text: '铁路区间怎么填', link: '/西南科大新生指南/铁路区间怎么填' },
            { text: '档案相关', link: '/西南科大新生指南/档案相关' },
            { text: '户口迁移相关', link: '/西南科大新生指南/户口迁移相关' },
            { text: '绿色通道 / 助学贷款', link: '/西南科大新生指南/绿色通道_助学贷款信息填写相关' },
            { text: '学费与住宿费参考', link: '/西南科大新生指南/学费与住宿费参考' },
            { text: '大学生医保', link: '/西南科大新生指南/大学生医保' },
            { text: '家长权限?', link: '/西南科大新生指南/家长权限？' },
          ],
        },
        {
          text: '报到指南',
          collapsed: false,
          items: [
            { text: '第一节:报道必备文书类物品', link: '/西南科大新生指南/第一节：报道必备文书类物品' },
            { text: '报到地点相关', link: '/西南科大新生指南/报到地点相关' },
            { text: '报到流程相关', link: '/西南科大新生指南/报到流程相关' },
            { text: '生活物品相关', link: '/西南科大新生指南/生活物品相关' },
            { text: '学习用品相关以及快递地址', link: '/西南科大新生指南/学习用品相关以及快递地址' },
            { text: '寝室选择指南', link: '/西南科大新生指南/寝室选择指南' },
          ],
        },
        {
          text: '入学后',
          collapsed: true,
          items: [
            { text: '人脸录入相关', link: '/西南科大新生指南/人脸录入相关' },
            { text: '加入部门 / 社团', link: '/西南科大新生指南/加入部门_社团' },
            { text: '校内出行', link: '/西南科大新生指南/校内出行' },
            { text: '跨校区出行', link: '/西南科大新生指南/跨校区出行' },
            { text: '培养方案以及选课', link: '/西南科大新生指南/培养方案以及选课' },
            { text: '学分 / 绩点 / 综测 / 活动证明', link: '/西南科大新生指南/学分？绩点？综测？活动证明？一次讲清楚' },
            { text: '转专业 / 大类分流', link: '/西南科大新生指南/转专业_大类分流' },
            { text: '大学学车(待更新)', link: '/西南科大新生指南/大学学车（待更新）' },
          ],
        },
        {
          text: '校园资源',
          collapsed: true,
          items: [
            { text: '学校群聊 / QQ / 公众号 / 网站推荐', link: '/西南科大新生指南/学校群聊、QQ、微信公众号、网站推荐' },
          ],
        },
        {
          text: '防骗专题',
          collapsed: true,
          items: [
            { text: '花式防骗', link: '/西南科大新生指南/花式防骗' },
            { text: '谨慎办理学校手机卡', link: '/西南科大新生指南/谨慎办理学校手机卡' },
          ],
        },
      ],

      '/西山校区生活指南/': [
        {
          text: '西山校区生活',
          collapsed: false,
          items: [
            { text: '住在西山', link: '/西山校区生活指南/住在西山' },
            { text: '食在西山', link: '/西山校区生活指南/食在西山' },
            { text: '行在西山', link: '/西山校区生活指南/行在西山' },
            { text: '学在西山', link: '/西山校区生活指南/学在西山' },
            { text: '外卖和快递', link: '/西山校区生活指南/西山校区的外卖和快递' },
          ],
        },
      ],

      '/青义校区生活指南/': [
        {
          text: '青义校区生活',
          collapsed: false,
          items: [
            { text: '食在青义', link: '/青义校区生活指南/食在青义' },
            { text: '老区寝室讲解', link: '/青义校区生活指南/老区生活指南/寝室讲解' },
          ],
        },
      ],
    },

    outline: { level: [2, 3], label: '本页目录' },

    // 中文本地化
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
    outlineTitle: '本页目录',
    lastUpdatedText: '最后更新于',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色主题',
    darkModeSwitchTitle: '切换到深色主题',
    sidebarMenuLabel: '侧边栏',
    returnToTopLabel: '回到顶部',

    // 站内搜索 — 内置 minisearch,中文支持依赖分词
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          searchOptions: {
            // 中文不分词也行,反正搜不到时会显示 "没有结果"
            boost: { title: 4, text: 1 },
            fuzzy: 0.2,
            prefix: true,
          },
        },
      },
    },

    footer: {
      message: '基于 CC BY-NC-SA 4.0 协议发布 · 笔者归隐人士',
      copyright: 'Copyright © 2022-present 归隐人士',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/guiyinrenshi/SWUSTFreshmanGuide' },
    ],

    editLink: {
      pattern: 'https://github.com/guiyinrenshi/SWUSTFreshmanGuide/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

  },
})
