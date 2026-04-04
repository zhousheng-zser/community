/**
 * 惠民卡京东联盟：与 流量联盟/京东联盟.md 对齐；sku_id = u.jd.com 短链 path；数据以本表为准，小程序从接口加载
 * 用法：配置 .env 后 npm run seed:jd-benefit
 * 主图：/img/jd_benefit/{sku_id}.png（见 流量联盟/jd_local_images.json + scripts/sync-jd-benefit-images-from-local.js）
 */
require('dotenv').config();
const { sequelize, JdBenefitGood } = require('../src/jd');

const localImg = (skuId) => `/img/jd_benefit/${skuId}.png`;

/** sku_id 为短链 path 段，与京挑客跳转、jd/promotion/spread-url 查询一致 */
const samples = [
  {
    scene: 'benefit_card',
    sku_id: 'c64wRk8',
    title: '雪亮500张大包抽纸优等品5层加厚纸巾大尺寸面巾纸餐巾纸可湿水卫生纸 5层 500张',
    image_url: localImg('c64wRk8'),
    spread_url: 'https://u.jd.com/c64wRk8',
    price: null,
    rebate_amount: null,
    sort_order: 1,
    status: 1
  },
  {
    scene: 'benefit_card',
    sku_id: 'cg409N9',
    title: '伊利【新鲜日期】纯牛奶250ml*21盒 早餐奶 财神装普通礼盒装混发',
    image_url: localImg('cg409N9'),
    spread_url: 'https://u.jd.com/cg409N9',
    price: null,
    rebate_amount: null,
    sort_order: 2,
    status: 1
  },
  {
    scene: 'benefit_card',
    sku_id: 'c14zUDW',
    title: '鲜京采 30/40厄瓜多尔白虾 去冰净重3.3斤 50-66只/盒',
    image_url: localImg('c14zUDW'),
    spread_url: 'https://u.jd.com/c14zUDW',
    price: null,
    rebate_amount: null,
    sort_order: 3,
    status: 1
  },
  {
    scene: 'benefit_card',
    sku_id: 'cO4Gh0k',
    title: '圣上用膳五常大米 10斤 GB/T 19266 五常香米 当季新米 东北大米',
    image_url: localImg('cO4Gh0k'),
    spread_url: 'https://u.jd.com/cO4Gh0k',
    price: null,
    rebate_amount: null,
    sort_order: 4,
    status: 1
  },
  {
    scene: 'benefit_card',
    sku_id: 'cG4nIbb',
    title: '京鲜生 四川春见耙耙柑 净重8.5-9斤水果礼盒 单果170g+ 源头直发包邮',
    image_url: localImg('cG4nIbb'),
    spread_url: 'https://u.jd.com/cG4nIbb',
    price: null,
    rebate_amount: null,
    sort_order: 5,
    status: 1
  },
  {
    scene: 'benefit_card',
    sku_id: 'cG4vgVg',
    title: '伊利【新鲜日期】金典纯牛奶早餐奶250ml*16 3.6g乳蛋白 礼盒装 2-3月',
    image_url: localImg('cG4vgVg'),
    spread_url: 'https://u.jd.com/cG4vgVg',
    price: null,
    rebate_amount: null,
    sort_order: 6,
    status: 1
  },
  {
    scene: 'benefit_card',
    sku_id: 'cg4pcQF',
    title: '漫花山茶花大包抽纸纸巾大尺寸餐巾纸面巾纸家用卫生纸原木纸抽纸C 山茶花抽',
    image_url: localImg('cg4pcQF'),
    spread_url: 'https://u.jd.com/cg4pcQF',
    price: null,
    rebate_amount: null,
    sort_order: 7,
    status: 1
  },
  {
    scene: 'benefit_card',
    sku_id: 'c14OhB8',
    title: '广东徐闻香水菠萝新鲜水果生鲜热带孕妇水果整箱包邮',
    image_url: localImg('c14OhB8'),
    spread_url: 'https://u.jd.com/c14OhB8',
    price: null,
    rebate_amount: null,
    sort_order: 8,
    status: 1
  }
];

async function run() {
  await sequelize.authenticate();
  await JdBenefitGood.sync({ alter: true });
  for (const row of samples) {
    const [inst, created] = await JdBenefitGood.findOrCreate({
      where: { scene: row.scene, sku_id: row.sku_id },
      defaults: row
    });
    if (!created) {
      await inst.update({
        title: row.title,
        image_url: row.image_url,
        spread_url: row.spread_url,
        price: row.price,
        rebate_amount: row.rebate_amount,
        sort_order: row.sort_order,
        status: row.status
      });
    }
  }
  console.log('seed jd_benefit_goods ok, count:', samples.length);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
