/**
 * 惠民卡 · 与仓库根目录「流量联盟」文档对齐的本地数据（deeplink / 主图路径与 京东联盟.md、拼多多.md 一致）
 * 主图需先执行：node scripts/sync-jd-benefit-images-from-local.js、sync-pdd-benefit-images-from-local.js
 */

const JD_ITEMS = [
  { skuId: 'c64wRk8', title: '雪亮500张大包抽纸优等品5层加厚纸巾大尺寸面巾纸餐巾纸可湿水卫生纸 5层 500张 20包', spreadUrl: 'https://u.jd.com/c64wRk8' },
  { skuId: 'cg409N9', title: '伊利【新鲜日期】纯牛奶250ml*21盒 早餐奶 财神装普通礼盒装混发', spreadUrl: 'https://u.jd.com/cg409N9' },
  { skuId: 'c14zUDW', title: '鲜京采 30/40厄瓜多尔白虾 去冰净重3.3斤 50-66只/盒', spreadUrl: 'https://u.jd.com/c14zUDW' },
  { skuId: 'cO4Gh0k', title: '圣上用膳五常大米 10斤 GB/T 19266 五常香米 当季新米 东北大米', spreadUrl: 'https://u.jd.com/cO4Gh0k' },
  { skuId: 'cG4nIbb', title: '京鲜生 四川春见耙耙柑 净重8.5-9斤水果礼盒 单果170g+ 源头直发包邮', spreadUrl: 'https://u.jd.com/cG4nIbb' },
  { skuId: 'cG4vgVg', title: '伊利【新鲜日期】金典纯牛奶早餐奶250ml*16 3.6g乳蛋白 礼盒装 2-3月', spreadUrl: 'https://u.jd.com/cG4vgVg' },
  { skuId: 'cg4pcQF', title: '漫花山茶花大包抽纸纸巾大尺寸餐巾纸面巾纸家用卫生纸原木纸抽纸C 山茶花抽纸 5层 400张 6包', spreadUrl: 'https://u.jd.com/cg4pcQF' },
  { skuId: 'c14OhB8', title: '广东徐闻香水菠萝新鲜水果生鲜热带孕妇水果整箱包邮 【限时低价】1个装 净重650g起', spreadUrl: 'https://u.jd.com/c14OhB8' }
];

const PDD_ITEMS = [
  { linkKey: 'VRM3IEUm', title: '重磅秋冬季300克德绒保暖圆领上衣加绒设计打底长袖拼接ins', price: '78.00', couponPrice: '58.00', spreadUrl: 'https://p.pinduoduo.com/VRM3IEUm?sc=EFAC' },
  { linkKey: 'jKH3Fh91', title: '心相印抽纸餐巾纸纸巾大包面巾纸批发90抽擦手纸家用卫生纸实惠', price: '108.00', couponPrice: '88.00', spreadUrl: 'https://p.pinduoduo.com/jKH3Fh91?sc=EFAC' },
  { linkKey: 'Vvs3caRv', title: '新款雪尼尔平板拖把免手洗家用吸水干湿两用大号拖布懒人拖地神器', price: '35.90', couponPrice: '15.90', spreadUrl: 'https://p.pinduoduo.com/Vvs3caRv?sc=EFAC' },
  { linkKey: '6tA3bfap', title: 'Zippo秋水含睛保温杯女生高颜值咖啡杯子不锈钢便携情侣直饮水杯', price: '110.00', couponPrice: '100.00', spreadUrl: 'https://p.pinduoduo.com/6tA3bfap?sc=EFAC' },
  { linkKey: 'OF53r22C', title: '匹克态极维金斯天赋一代篮球鞋球鞋男鞋耐磨专业实战低帮比赛战靴', price: '150.00', couponPrice: '148.00', spreadUrl: 'https://p.pinduoduo.com/OF53r22C?sc=EFAC' },
  { linkKey: 'QE73xVwd', title: '白象经典拌面火鸡面奶油泡面袋装白象方便面官方旗舰店整箱批发', price: '35.00', couponPrice: '25.00', spreadUrl: 'https://p.pinduoduo.com/QE73xVwd?sc=EFAC' },
  { linkKey: 'nbf3xg02', title: '得宝抽纸36-54包4层80抽整箱小雏菊卫生纸家用批发餐巾纸面巾纸', price: '117.70', couponPrice: '69.70', spreadUrl: 'https://p.pinduoduo.com/nbf3xg02?sc=EFAC' },
  { linkKey: 'bIn3iHWL', title: 'MSQ/魅丝蔻10支有点蓝化妆刷套装全套刷子正品眼影腮红遮瑕鼻影刷', price: '35.00', couponPrice: '33.00', spreadUrl: 'https://p.pinduoduo.com/bIn3iHWL?sc=EFAC' }
];

const JD_HERO_TITLE = '惠民卡 · 京东联盟';
const JD_HERO_SUB = '领券购物 · 分享返佣';
const PDD_HERO_TITLE = '惠民卡 · 拼多多';
const PDD_HERO_SUB = '多多进宝 · 券后价更省';

function mapJdGoods() {
  return JD_ITEMS.map((x, idx) => ({
    id: idx + 1,
    skuId: x.skuId,
    title: x.title,
    image: `/img/jd_benefit/${x.skuId}.png`,
    price: '',
    rebateAmount: '',
    spreadUrl: x.spreadUrl
  }));
}

function mapPddGoods() {
  return PDD_ITEMS.map((x, idx) => ({
    id: idx + 1,
    goodsId: '',
    title: x.title,
    image: `/img/pdd_benefit/${x.linkKey}.jpeg`,
    price: x.price,
    couponPrice: x.couponPrice,
    rebateAmount: '',
    spreadUrl: x.spreadUrl,
    miniPath: ''
  }));
}

/**
 * @returns {{ jdGoods: object[], pddGoods: object[], jdEntry: object, pddEntry: object, jdHeroTitle: string, jdHeroSubtitle: string, pddHeroTitle: string, pddHeroSubtitle: string }}
 */
function getLocalBenefitCardPayload() {
  const jdGoods = mapJdGoods();
  const pddGoods = mapPddGoods();
  const jd0 = jdGoods[0] || {};
  const p0 = pddGoods[0] || {};
  return {
    jdGoods,
    pddGoods,
    jdEntry: { skuId: jd0.skuId || '', spreadUrl: jd0.spreadUrl || '' },
    pddEntry: {
      spreadUrl: p0.spreadUrl || 'https://mobile.yangkeduo.com/',
      miniPath: '',
      goodsId: ''
    },
    jdHeroTitle: JD_HERO_TITLE,
    jdHeroSubtitle: JD_HERO_SUB,
    pddHeroTitle: PDD_HERO_TITLE,
    pddHeroSubtitle: PDD_HERO_SUB
  };
}

module.exports = {
  getLocalBenefitCardPayload,
  JD_ITEMS,
  PDD_ITEMS
};
