/**
 * 惠民卡种子：node scripts/seed-benefit.js [jd|pdd|config|all]
 * 需 backend/.env 中 DB_* 可连库；表不存在请先 npm run migrate:benefit
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const {
  JdBenefitGood,
  PddBenefitGood,
  BenefitAllianceConfig,
  sequelize
} = require('../src/models');

const SCENE = 'benefit_card';

const JD_ROWS = [
  ['c14OhB8', '京东精选好物 1', 80],
  ['c14zUDW', '京东精选好物 2', 70],
  ['c64wRk8', '京东精选好物 3', 60],
  ['cG4nIbb', '京东精选好物 4', 50],
  ['cG4vgVg', '京东精选好物 5', 40],
  ['cO4Gh0k', '京东精选好物 6', 30],
  ['cg409N9', '京东精选好物 7', 20],
  ['cg4pcQF', '京东精选好物 8', 10]
].map(([sku_id, title, sort_order]) => ({
  scene: SCENE,
  sku_id,
  title,
  image_url: `/img/jd_benefit/${sku_id}.png`,
  spread_url: `https://u.jd.com/${sku_id}`,
  price: '',
  rebate_amount: '',
  sort_order,
  status: 1
}));

const PDD_ROWS = [
  ['6tA3bfap', '拼多多精选 1', 80],
  ['OF53r22C', '拼多多精选 2', 70],
  ['QE73xVwd', '拼多多精选 3', 60],
  ['VRM3IEUm', '拼多多精选 4', 50],
  ['Vvs3caRv', '拼多多精选 5', 40],
  ['bIn3iHWL', '拼多多精选 6', 30],
  ['jKH3Fh91', '拼多多精选 7', 20],
  ['nbf3xg02', '拼多多精选 8', 10]
].map(([link_key, title, sort_order]) => ({
  scene: SCENE,
  link_key,
  goods_id: link_key,
  title,
  image_url: `/img/pdd_benefit/${link_key}.jpeg`,
  spread_url: `https://p.pinduoduo.com/${link_key}`,
  mini_path: `pages/goods/goods?goods_id=${encodeURIComponent(link_key)}`,
  price: '',
  coupon_price: '',
  rebate_amount: '',
  sort_order,
  status: 1
}));

const CONFIG_ROWS = [
  {
    scene: SCENE,
    platform: 'jd',
    hero_image_url: '/img/benefit_alliance/jd-alliance.png',
    hero_title: '',
    hero_subtitle: ''
  },
  {
    scene: SCENE,
    platform: 'pdd',
    hero_image_url: '/img/benefit_alliance/pdd-alliance.png',
    hero_title: '',
    hero_subtitle: ''
  }
];

async function seedJd() {
  for (const row of JD_ROWS) {
    await JdBenefitGood.upsert(row);
  }
  console.log(`jd_benefit_goods: upsert ${JD_ROWS.length} rows`);
}

async function seedPdd() {
  for (const row of PDD_ROWS) {
    await PddBenefitGood.upsert(row);
  }
  console.log(`pdd_benefit_goods: upsert ${PDD_ROWS.length} rows`);
}

async function seedConfig() {
  for (const row of CONFIG_ROWS) {
    await BenefitAllianceConfig.upsert(row);
  }
  console.log(`benefit_alliance_config: upsert ${CONFIG_ROWS.length} rows`);
}

(async () => {
  const mode = (process.argv[2] || 'all').toLowerCase();
  try {
    if (mode === 'jd') await seedJd();
    else if (mode === 'pdd') await seedPdd();
    else if (mode === 'config') await seedConfig();
    else if (mode === 'all') {
      await seedJd();
      await seedPdd();
      await seedConfig();
    } else {
      console.error('Usage: node scripts/seed-benefit.js [jd|pdd|config|all]');
      process.exitCode = 1;
      return;
    }
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
