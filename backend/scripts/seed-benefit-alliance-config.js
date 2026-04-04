/**
 * 惠民卡联盟顶栏配置（头图 URL 存库，文件本体在小程序 img/ 目录）
 * 与 流量联盟 设计稿同步：img/benefit_alliance/jd-alliance.png、pdd-alliance.png
 * backend 目录执行：npm run seed:benefit-alliance-config
 */
require('dotenv').config();
const { sequelize, BenefitAllianceConfig } = require('../src/jd');

const samples = [
  {
    scene: 'benefit_card',
    platform: 'jd',
    hero_image_url: '/img/benefit_alliance/jd-alliance.png',
    hero_title: null,
    hero_subtitle: null,
    sort_order: 0,
    status: 1
  },
  {
    scene: 'benefit_card',
    platform: 'pdd',
    hero_image_url: '/img/benefit_alliance/pdd-alliance.png',
    hero_title: null,
    hero_subtitle: null,
    sort_order: 0,
    status: 1
  }
];

async function run() {
  await sequelize.authenticate();
  await BenefitAllianceConfig.sync({ alter: true });
  for (const row of samples) {
    const [inst, created] = await BenefitAllianceConfig.findOrCreate({
      where: { scene: row.scene, platform: row.platform },
      defaults: row
    });
    if (!created) {
      await inst.update({
        hero_image_url: row.hero_image_url,
        hero_title: row.hero_title,
        hero_subtitle: row.hero_subtitle,
        sort_order: row.sort_order,
        status: row.status
      });
    }
  }
  console.log('seed benefit_alliance_config ok, count:', samples.length);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
