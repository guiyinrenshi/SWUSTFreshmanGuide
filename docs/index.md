---
layout: home

hero:
  name: 西南科大新生指南
  text: 提高新生入学体验的非官方指南
  tagline: 本指南为学校新生手册的补充和完善,以社区力量共同维护。
  actions:
    - theme: brand
      text: 西南科大新生指南
      link: /西南科大新生指南/前言
    - theme: alt
      text: 西山校区生活指南
      link: /西山校区生活指南/住在西山
    - theme: alt
      text: GitHub 仓库
      link: https://github.com/guiyinrenshi/SWUSTFreshmanGuide

features:
  - icon: 🧭
    title: 预报到
    details: 录取通知书、预报到填写、档案户口、医保、助学贷款,把入学前要办的事一次性说清楚。
  - icon: 🎒
    title: 报到当天
    details: 报到地点、必备文书、生活物品、学习用品、快递地址、寝室选择,新生现场不再手忙脚乱。
  - icon: 📚
    title: 入学之后
    details: 选课、培养方案、学分绩点综测、转专业分流、人脸录入、社团部门,把第一学期要踩的坑提前告诉你。
  - icon: 🛡️
    title: 花式防骗
    details: 校园手机卡无良推销、兼职陷阱、虚假助学,识别套路保护自己。
  - icon: 🏠
    title: 校区生活
    details: 西山校区、青义校区,住宿 / 餐饮 / 出行 / 学业 / 外卖快递独立成章。
  - icon: 🤝
    title: 社区维护
    details: 由归隐人士于 2022 年发起,目前由西南科技大学经济管理学院归隐人士与社区共同维护,欢迎 PR。

---

## 2026 年更新

说起来今年已经是我维护这个指南的第五个年头了,五年前当我以新生的身份写这个指南的时候我的本意就是想让新生更方便查到自己需要的信息,当我今年以校友的身份再一次开始更新时,我的初心依旧是让新生少走弯路。随着 AI 的不断发展,AI 已经渗透到了日常生活的方方面面,新生指南也要与时俱进,与时代共同成长,今年,我创新性使用 AI Agent 来协助我维护这个项目,用 AI 生成的网页替代了原先的网页,希望能给新生提供更便利的使用环境,同时我也将依靠 AI 来更新指南的形式与内容,为新生带来更好的体验。

<div class="ai-home-card">
  <div class="ai-home-card-text">
    <strong>🤖 有问题?问问 AI 助理</strong>
    <span>基于站内文章智能回答,医保 / 寝室 / 转专业 / 报到流程都能问。</span>
  </div>
  <button type="button" onclick="window.__openAIChat && window.__openAIChat()">开始提问</button>
</div>

<style>
.ai-home-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 20px 0;
  padding: 16px 20px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 12px;
  background: var(--vp-c-brand-soft);
}
.ai-home-card-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ai-home-card-text strong { font-size: 15px; color: var(--vp-c-brand-1); }
.ai-home-card-text span { font-size: 13px; color: var(--vp-c-text-2); }
.ai-home-card button {
  flex-shrink: 0;
  padding: 8px 18px;
  border: none;
  border-radius: 999px;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all .2s;
}
.ai-home-card button:hover { background: var(--vp-c-brand-2); }
@media (max-width: 640px) {
  .ai-home-card { flex-direction: column; align-items: stretch; text-align: center; }
}
</style>

---

## 关于本指南

本指南是由西南科技大学经济管理学院的归隐人士所撰写的用于提高新生入学体验的西南科技大学**非官方**新生指南。本指南为对学校新生手册的补充和完善,**不能替代新生手册**。

本指南表述与新生手册和学院老师表述有不符之处,请以新生手册和学院老师表述为准。如有疑问可以提 [Issue](https://github.com/guiyinrenshi/SWUSTFreshmanGuide/issues)。

## 为何会有这个指南

本指南是笔者在 2022 年新生入学时看到很多同学在咨询之前他人已经解答过的问题,心血来潮之下临时提笔写就的小小文章,后续为了给后面的新生答疑解惑便维护了 4 年。由于笔者毕业在即,故将该指南开源到社区以与社区共同维护。

## 如何贡献

- 发现内容过时 / 错误 → 提 [Issue](https://github.com/guiyinrenshi/SWUSTFreshmanGuide/issues)
- 愿意直接修改 → Fork 仓库后修改 `docs/` 下对应 Markdown,发 Pull Request
- 想线下交流 → 参见 [学校群聊 / QQ / 公众号 / 网站推荐](/西南科大新生指南/学校群聊、QQ、微信公众号、网站推荐)

## 版权声明

本指南由归隐人士及社区贡献者共同维护。

**文字内容**（docs/ 下各 Markdown 文件）依据 **CC BY-NC-SA 4.0**（署名-非商业性使用-相同方式共享 4.0 国际）许可协议授权：可以转载、修改，但必须注明原作者与出处链接，不得用于商业用途，衍生作品必须采用相同许可。

**网站程序代码**（docs/.vitepress/ 等工程文件）依据 **MIT License** 授权，可自由使用、修改和分发。

第三方内容（包括但不限于引用的小红书博主观点、第三方信息平台数据、学校官方资料等）版权归原权利人所有，不适用本仓库许可协议，使用时请遵循原出处要求。

商业转载请联系作者获得授权，非商业转载请注明出处。请附上出处链接及本声明。
