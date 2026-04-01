/**
 * 写入惠民卡京东联盟示例数据（单表 jd_benefit_goods）
 * 用法：配置 .env 后 npm run seed:jd-benefit
 * 需先建表：DB_SYNC_JD=1 启动一次，或执行 sql/jd_benefit_goods.sql
 */
require('dotenv').config();
const { sequelize, JdBenefitGood } = require('../src/jd');

const samples = [
  {
    scene: 'benefit_card',
    sku_id: '100010713464',
    title: '农夫山泉饮用水',
    image_url:
      'https://img14.360buyimg.com/n1/jfs/t1/109790/26/17784/177728/5e8c0ec6E92281c9a/7df0d2c6d1a6c0bf.jpg',
    spread_url: 'https://u.jd.com/cGYRLnW',
    price: 19.9,
    rebate_amount: null,
    sort_order: 1,
    status: 1
  },
  {
    scene: 'benefit_card',
    sku_id: '100012345678',
    title: '汽车蓝牙音箱',
    image_url:
      'https://img14.360buyimg.com/n1/jfs/t1/204916/15/3368/156780/616a4f5aE4d1f7b4e/2e09b5f508a403ef.jpg',
    spread_url: 'https://u.jd.com/c6YU7o1',
    price: 99.0,
    rebate_amount: 5.0,
    sort_order: 2,
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
