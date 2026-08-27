/**
 * Simplified Chinese, shorter than the English, everywhere, on purpose.
 *
 * WHAT MOVED, AND WHY. English luxury copy builds a mood over three clauses.
 * Chinese luxury copy that does the same reads as a brand explaining itself,
 * which is the opposite of confident. So nearly every line here is cut to
 * roughly half the English length, and the four-character rhythm (持牌经营、
 * 长期持有、以数为凭) carries the weight that the English carries with subordinate
 * clauses.
 *
 * The substantive move is 产权. For this reader the first question about foreign
 * property is not yield, it is whether ownership is real and registered, so
 * 产权登记 and 迪拜土地局 appear in the opening lines rather than being left to a
 * legal note further down.
 *
 * 您 throughout. Nothing here touches capital movement, remittance or tax
 * residency, which are the questions this audience most often asks and which
 * belong to a qualified adviser rather than a marketing page.
 */
import { brand } from "../config/brand.ts";
import type { Dictionary } from "./en.ts";

export const zh: Dictionary = {
  meta: {
    "/": {
      title: "DLX Properties, 迪拜房地产，以审慎之心经手",
      description:
        "迪拜私人地产经纪：优质住宅收购、非公开交易与长期资产配置顾问。RERA 持牌编号 40905。",
      tagline: "迪拜房地产，以审慎之心经手。",
    },
    "/about": {
      title: "关于 DLX",
      description:
        "一家刻意保持小规模的迪拜经纪行，同期只服务有限客户。RERA 持牌编号 40905，办公室位于商业湾。",
      tagline: "客户更少，服务更实。",
    },
    "/services": {
      title: "服务",
      description: "收购、出售、资产配置、黄金签证指引与迁居支持，服务于私人业主与家族办公室。",
      tagline: "我们做什么，以及如何收费。",
    },
    "/tools": {
      title: "计算器",
      description: "依据迪拜现行费率，算清购房总成本、租金回报率、按揭月供与黄金签证门槛。",
      tagline: "先把账算清，再谈其他。",
    },
    "/contact": {
      title: "联系我们",
      description: "就迪拜置业、出售或迁居与 DLX 顾问直接沟通。由专人亲自回复，通常当日答复。",
      tagline: "是交流，不是推销电话。",
    },
  },

  nav: {
    home: "首页",
    properties: "房源",
    services: "服务",
    marketIntelligence: "市场数据",
    areas: "区域",
    tools: "计算器",
    developers: "开发商",
    team: "团队",
    guides: "指南",
    blog: "观察",
    about: "关于我们",
    contact: "联系我们",
    privacy: "隐私",
    openMenu: "菜单",
    closeMenu: "关闭",
    primaryLabel: "主导航",
    homeAria: "DLX Properties, 返回首页",
    skipToContent: "跳至正文",
  },

  common: {
    view: "查看",
    viewAll: "查看全部",
    readMore: "阅读全文",
    inEnglish: "英文",
    inEnglishTitle: "本页仅以英文发布。",
    loading: "载入中…",
    close: "关闭",
    source: "来源",
    updated: "更新于",
  },

  home: {
    eyebrow: "迪拜 · 私人地产经纪",
    headline: ["迪拜房地产，", "以审慎之心"],
    headlineAccent: "经手。",
    ctaPortfolio: "查看房源",
    ctaConsult: "私人咨询",
    practiceEyebrow: "我们的业务",
    practiceStatement: "我们在迪拜核心区域只服务有限客户--建议从容，议价精准，看重长期价值。",
    practiceSupport:
      "产权在迪拜土地局登记，交易全程走官方流程。为私人业主、家族办公室及首次进入本地市场者提供收购、出售与资产配置服务。",
    disciplines: {
      sales: "非公开交易",
      advisory: "顾问与服务",
      market: "市场数据",
      guides: "指南",
    },
    selectedEyebrow: "精选",
    selectedTitle: "房源一览",
    selectedLink: "查看全部房源",
    closingTitle: "从一次安静的交流开始。",
    closingBody: "无论您是买入、退出，还是仅在观察市场，我们都可以私下聊聊，不带任何附加条件。",
    closingCta: "联系 DLX",
    faq: [
      {
        question: "DLX Properties 是迪拜持牌经纪行吗？",
        answer: `是。${brand.name} 以 RERA 办公室注册编号 ${brand.reraOrn} 持牌经营，办公室位于迪拜商业湾。我们经手的每一笔交易，都通过迪拜土地局（Dubai Land Department）的官方流程完成。`,
      },
      {
        question: "DLX 具体为客户做什么？",
        answer:
          "三件事：收购、出售、资产配置。我们同期只服务有限客户--买入时代您寻找房源并议价；出售时以非公开方式处理，不做公开推广，也不披露业主身份；持有期间则就何者续持、何者出售、何者重组给出建议。",
      },
      {
        question: "必须人在迪拜才能买吗？",
        answer:
          "不必。我们相当一部分客户在海外完成置业，我们也是按远程代理的方式配置的--看房、尽职调查与议价均由我们代为处理。若某一环节依法需要您本人到场或出具授权委托书，我们会在您作出任何承诺之前先行说明。",
      },
    ],
  },

  about: {
    eyebrow: "关于我们",
    title: "客户更少，服务更实。",
    lead: "DLX 刻意保持小规模。我们同期只接有限委托，因为另一条路--同时应付上百位只被服务了一半的买家--正是多数经纪行的做法，也正是多数买家觉得无人真正代表自己的原因。",
    licenceEyebrow: "牌照",
    licenceBody: `${brand.name} 由迪拜土地局下属监管机构 RERA 发牌，办公室注册编号 ${brand.reraOrn}，办公地点位于迪拜商业湾。每笔交易均走土地局官方流程；我们公布的每一个数字，都附来源与日期。`,
    principlesEyebrow: "我们如何做事",
    principles: [
      {
        title: "把真实数字告诉您。",
        body: "产权过户费、经纪佣金、物业服务费，以及您多半没算进预算的按揭登记费。购房的全部成本，在您决定之前先说清。",
      },
      {
        title: "该说不时就说不。",
        body: "若某栋楼的物业费存在问题，或某开发商的交付记录连我们自己都不会接受，您会听到实话--即便这句话让我们丢掉这单生意。",
      },
      {
        title: "过户之后仍在。",
        body: "交房、验收整改、出租、再售时机。经纪行与客户的长期关系，远比一单佣金值钱；照此行事，本身就是我们全部的策略。",
      },
    ],
    ctaTitle: "找一个真会回复您的人。",
    ctaBody: "没有呼叫中心，不用排队。顾问亲自读您的留言，亲自回复。",
    ctaButton: "联系 DLX",
  },

  services: {
    eyebrow: "服务",
    title: "我们做什么，以及如何收费。",
    lead: "五项业务，一支团队。每一项委托，要么认真做好，要么不接。",
    detailLink: "查看详情",
    ctaTitle: "不确定自己需要哪一项？",
    ctaBody:
      "用一两句话说明您的情况。顾问会告诉您这件事实际涉及什么--包括答案是「您暂时还用不上我们」。",
    ctaButton: "开始交流",
  },

  tools: {
    eyebrow: "计算器",
    title: "先把账算清，再谈其他。",
    lead: "这里的每个计算器都基于迪拜现行费率，附来源与日期。查看结果无需留下任何个人信息。",
    openTool: "打开计算器",
    noteTitle: "计算器本身为英文界面。",
    noteBody:
      "数字不因语言而异--迪拜的费率不会因读者不同而改变。若您希望有人用中文陪您把这笔账过一遍，可询问我们的智能顾问，或直接联系顾问。",
    ctaButton: "咨询顾问",
  },

  contact: {
    eyebrow: "联系我们",
    title: "是交流，不是推销电话。",
    lead: "告诉我们您想做什么。顾问会亲自阅读并回复--通常当日答复，且给的是有用的内容，而不是一句「约个时间通话」。",
    officeEyebrow: "办公室",
    hoursEyebrow: "工作时间",
    hoursBody: "周日至周四 9:00-18:00（海湾标准时间）。周末的留言我们同样会看。",
    directEyebrow: "直接联系",
    licenceLine: `RERA 持牌编号 ${brand.reraOrn}`,
  },

  footer: {
    closing: "找一个真会回复您的人。",
    closingCta: "联系 DLX",
    tagline: "迪拜房地产，以审慎之心经手。",
    exploreHeading: "浏览",
    contactHeading: "联系",
    legalHeading: "法律信息",
    licence: `RERA 持牌编号 ${brand.reraOrn}`,
    rights: "版权所有。",
    languageHeading: "语言",
  },

  form: {
    stepOf: "第 {current} 步，共 {total} 步",
    title: "开始交流",
    description: "告诉我们您在找什么。顾问会亲自回复--通常当日答复。",
    intentLegend: "您来 DLX 是为了？",
    intents: {
      buy: "购置自住房",
      invest: "投资",
      sell: "出售房产",
      rent: "租赁",
      relocate: "迁居迪拜",
      advice: "先了解一下",
    },
    timelineLegend: "您希望何时推进？",
    timelines: {
      immediately: "现在就可以",
      within_3_months: "未来三个月",
      within_12_months: "今年之内",
      researching: "仍在了解阶段",
    },
    budgetLabel: "预算",
    budgetHint: "给个大致区间即可--这样我们才能推荐对的房源。",
    budgetSkip: "暂不透露",
    nameLabel: "姓名",
    emailLabel: "电子邮箱",
    phoneLabel: "电话",
    phoneHint: "请加上国家代码。",
    contactPreferenceLabel: "最方便的联系方式",
    contactPreferences: {
      none: "都可以",
      email: "邮箱",
      phone: "电话",
      whatsapp: "WhatsApp",
    },
    messageLabel: "还有什么需要我们了解的？",
    continue: "继续",
    back: "返回",
    skipToDetails: "直接填写联系方式",
    submit: "提交咨询",
    submitting: "提交中…",
    needContact: "请留下邮箱或电话，我们才能回复您。",
    failed: "提交失败。请重试，或直接发邮件给我们，我们会跟进。",
    privacyNote: "您的信息仅用于回复本次咨询。不入名单，不对外分享。",
    sentEyebrow: "已收到",
    sentTitle: "谢谢，我们已收到。",
    sentBody: "顾问会亲自阅读并与您联系，通常当日答复。确认邮件正在发送。",
  },

  currency: {
    label: "货币",
    ariaLabel: "价格显示为",
    inAed: "迪拉姆",
    approx: "约",
    note: "按 {date} 汇率 {rate} 折算。合同货币为迪拉姆--您签署的是迪拉姆金额。",
    unavailable: "暂无实时汇率，价格仅以迪拉姆显示。",
    peggedNote: "迪拉姆与美元固定挂钩于 3.6725，此汇率不随市场波动。",
    detected: "因您似乎来自{country}，价格以{currency}显示。",
    change: "更改",
  },

  language: {
    label: "语言",
    ariaLabel: "选择语言",
    switcherHeading: "阅读本站",
    availableIn: "本页也有{language}版本。",
    notTranslatedTitle: "本页仅以英文发布。",
    notTranslatedBody:
      "我们的指南涉及迪拜的黄金签证门槛、费率表与税务规定。在具备资质的人员校核译文之前，这些内容只以英文发布--门槛译错，比不译更糟。我们的智能顾问可用中文作答，并援引同样的来源。",
    askAdvisor: "用中文提问",
  },

  consent: {
    body: "我们使用 Cookie 来衡量哪些推广带来了访客。在您作出选择之前，不会加载任何内容。",
    accept: "接受",
    decline: "拒绝",
    readPolicy: "隐私政策",
  },

  blocks: {
    faqEyebrow: "常见问题",
    faqTitle: "有问，有答",
    testimonialsEyebrow: "客户原话",
    testimonialsTitle: "客户如何评价",
    developersEyebrow: "开发商合作",
  },

  trust: {
    heading: "小型经纪行凭什么值得信任",
    credentials: [
      {
        label: "持牌",
        value: `RERA 注册编号 ${brand.reraOrn}`,
        detail: "已在迪拜房地产监管局备案。",
      },
      {
        label: "办公室",
        value: "迪拜商业湾",
        detail: "真实办公室，就设在我们做交易的区域。",
      },
      {
        label: "依据",
        value: "迪拜土地局数据",
        detail: "定价依据已登记的成交记录，并注明出处。",
      },
      {
        label: "语言",
        value: "五种语言",
        detail: "用您更愿意谈判的语言代表您。",
      },
    ],
  },
};
