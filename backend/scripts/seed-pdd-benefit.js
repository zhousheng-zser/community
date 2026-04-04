/**
 * 惠民卡拼多多：与 流量联盟/拼多多.md 对齐；数据以本表为准，小程序从接口加载
 * npm run seed:pdd-benefit
 */
require('dotenv').config();
const { sequelize, PddBenefitGood } = require('../src/jd');

/** 与 流量联盟/pdd_local_images.json + scripts/sync-pdd-benefit-images-from-local.js 生成的本地主图一致 */
const localImg = (linkKey) => `/img/pdd_benefit/${linkKey}.jpeg`;

const samples = [
  {
    scene: 'benefit_card',
    link_key: 'VRM3IEUm',
    goods_id: null,
    title: '重磅秋冬季300克德绒保暖圆领上衣加绒设计打底长袖拼接ins',
    image_url: localImg('VRM3IEUm'),
    spread_url: 'https://p.pinduoduo.com/VRM3IEUm?sc=EFAC',
    price: 78.0,
    coupon_price: 58.0,
    rebate_amount: null,
    mini_path: '',
    sort_order: 1,
    status: 1
  },
  {
    scene: 'benefit_card',
    link_key: 'jKH3Fh91',
    goods_id: null,
    title: '心相印抽纸餐巾纸纸巾大包面巾纸批发90抽擦手纸家用卫生纸实惠',
    image_url: localImg('jKH3Fh91'),
    spread_url: 'https://p.pinduoduo.com/jKH3Fh91?sc=EFAC',
    price: 108.0,
    coupon_price: 88.0,
    rebate_amount: null,
    mini_path: '',
    sort_order: 2,
    status: 1
  },
  {
    scene: 'benefit_card',
    link_key: 'Vvs3caRv',
    goods_id: null,
    title: '新款雪尼尔平板拖把免手洗家用吸水干湿两用大号拖布懒人拖地神器',
    image_url: localImg('Vvs3caRv'),
    spread_url: 'https://p.pinduoduo.com/Vvs3caRv?sc=EFAC',
    price: 35.9,
    coupon_price: 15.9,
    rebate_amount: null,
    mini_path: '',
    sort_order: 3,
    status: 1
  },
  {
    scene: 'benefit_card',
    link_key: '6tA3bfap',
    goods_id: null,
    title: 'Zippo秋水含睛保温杯女生高颜值咖啡杯子不锈钢便携情侣直饮水杯',
    image_url: localImg('6tA3bfap'),
    spread_url: 'https://p.pinduoduo.com/6tA3bfap?sc=EFAC',
    price: 110.0,
    coupon_price: 100.0,
    rebate_amount: null,
    mini_path: '',
    sort_order: 4,
    status: 1
  },
  {
    scene: 'benefit_card',
    link_key: 'OF53r22C',
    goods_id: null,
    title: '匹克态极维金斯天赋一代篮球鞋球鞋男鞋耐磨专业实战低帮比赛战靴',
    image_url: localImg('OF53r22C'),
    spread_url: 'https://p.pinduoduo.com/OF53r22C?sc=EFAC',
    price: 150.0,
    coupon_price: 148.0,
    rebate_amount: null,
    mini_path: '',
    sort_order: 5,
    status: 1
  },
  {
    scene: 'benefit_card',
    link_key: 'QE73xVwd',
    goods_id: null,
    title: '白象经典拌面火鸡面奶油泡面袋装白象方便面官方旗舰店整箱批发',
    image_url: localImg('QE73xVwd'),
    spread_url: 'https://p.pinduoduo.com/QE73xVwd?sc=EFAC',
    price: 35.0,
    coupon_price: 25.0,
    rebate_amount: null,
    mini_path: '',
    sort_order: 6,
    status: 1
  },
  {
    scene: 'benefit_card',
    link_key: 'nbf3xg02',
    goods_id: null,
    title: '得宝抽纸36-54包4层80抽整箱小雏菊卫生纸家用批发餐巾纸面巾纸',
    image_url: localImg('nbf3xg02'),
    spread_url: 'https://p.pinduoduo.com/nbf3xg02?sc=EFAC',
    price: 117.7,
    coupon_price: 69.7,
    rebate_amount: null,
    mini_path: '',
    sort_order: 7,
    status: 1
  },
  {
    scene: 'benefit_card',
    link_key: 'bIn3iHWL',
    goods_id: null,
    title: 'MSQ/魅丝蔻10支有点蓝化妆刷套装全套刷子正品眼影腮红遮瑕鼻影刷',
    image_url: localImg('bIn3iHWL'),
    spread_url: 'https://p.pinduoduo.com/bIn3iHWL?sc=EFAC',
    price: 35.0,
    coupon_price: 33.0,
    rebate_amount: null,
    mini_path: '',
    sort_order: 8,
    status: 1
  }
];

async function run() {
  await sequelize.authenticate();
  await PddBenefitGood.sync({ alter: true });
  for (const row of samples) {
    const [inst, created] = await PddBenefitGood.findOrCreate({
      where: { scene: row.scene, link_key: row.link_key },
      defaults: row
    });
    if (!created) {
      await inst.update({
        goods_id: row.goods_id,
        title: row.title,
        image_url: row.image_url,
        spread_url: row.spread_url,
        price: row.price,
        coupon_price: row.coupon_price,
        rebate_amount: row.rebate_amount,
        mini_path: row.mini_path,
        sort_order: row.sort_order,
        status: row.status
      });
    }
  }
  console.log('seed pdd_benefit_goods ok, count:', samples.length);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
