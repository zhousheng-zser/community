/**
 * 为首页「本地商城」挂载表灌入示例数据（来源：market_goods + market_shops，需店铺有经纬度）。
 * 需已执行 sync_db 创建 lg_home_* 表。
 *
 * 用法：node seed_local_goods_home.js
 */
require('dotenv').config();
const { Op } = require('sequelize');
const {
  sequelize,
  MarketGood,
  MarketShop,
  LgHomeDailyNewsProduct,
  LgHomeTopSalesProduct,
  LgHomePeriodicModule,
  LgHomePeriodicModuleProduct,
  LgHomeFeedModule,
  LgHomeFeedModuleProduct
} = require('./src/models');

async function pickGoodsWithCoords(limit) {
  const goods = await MarketGood.findAll({
    where: { status: 'on_sale' },
    order: [['id', 'ASC']],
    limit: Math.max(limit, 200)
  });
  const shopIds = [...new Set(goods.map((g) => Number(g.shop_id)))];
  const shops = await MarketShop.findAll({
    where: {
      id: { [Op.in]: shopIds },
      is_active: 1,
      latitude: { [Op.ne]: null },
      longitude: { [Op.ne]: null }
    }
  });
  const okShop = new Set(shops.map((s) => Number(s.id)));
  return goods.filter((g) => okShop.has(Number(g.shop_id))).slice(0, limit);
}

async function main() {
  await sequelize.authenticate();

  const pool = await pickGoodsWithCoords(120);
  if (pool.length < 5) {
    console.error('❌ 可用商品过少（需上架且店铺有经纬度）。请先灌 market 店铺商品。');
    process.exitCode = 1;
    return;
  }

  const t = await sequelize.transaction();
  try {
    await LgHomeFeedModuleProduct.destroy({ where: {}, transaction: t });
    await LgHomePeriodicModuleProduct.destroy({ where: {}, transaction: t });
    await LgHomeDailyNewsProduct.destroy({ where: {}, transaction: t });
    await LgHomeTopSalesProduct.destroy({ where: {}, transaction: t });
    await LgHomeFeedModule.destroy({ where: {}, transaction: t });
    await LgHomePeriodicModule.destroy({ where: {}, transaction: t });

    let cursor = 0;
    const take = (n) => {
      const out = [];
      for (let i = 0; i < n; i += 1) {
        out.push(pool[cursor % pool.length]);
        cursor += 1;
      }
      return out;
    };

    const daily = take(10);
    const top = take(10);
    const p1 = take(8);
    const p2 = take(8);
    const f1 = take(40);
    const f2 = take(40);

    await LgHomeDailyNewsProduct.bulkCreate(
      daily.map((g, i) => ({
        goods_id: g.id,
        shop_id: g.shop_id,
        sort: 100 - i,
        status: 1
      })),
      { transaction: t }
    );

    await LgHomeTopSalesProduct.bulkCreate(
      top.map((g, i) => ({
        goods_id: g.id,
        shop_id: g.shop_id,
        rank_no: i + 1,
        sort: 100 - i,
        status: 1
      })),
      { transaction: t }
    );

    const pm1 = await LgHomePeriodicModule.create(
      { module_name: '今日主推', sort: 100, status: 1 },
      { transaction: t }
    );
    const pm2 = await LgHomePeriodicModule.create(
      { module_name: '本周精选', sort: 90, status: 1 },
      { transaction: t }
    );

    for (const [mod, chunk] of [
      [pm1, p1],
      [pm2, p2]
    ]) {
      await LgHomePeriodicModuleProduct.bulkCreate(
        chunk.map((g, j) => ({
          module_id: mod.id,
          goods_id: g.id,
          shop_id: g.shop_id,
          sort: 100 - j,
          status: 1
        })),
        { transaction: t }
      );
    }

    const fm1 = await LgHomeFeedModule.create(
      { module_name: '高佣推荐', sort: 100, status: 1 },
      { transaction: t }
    );
    const fm2 = await LgHomeFeedModule.create(
      { module_name: '邻里好物', sort: 90, status: 1 },
      { transaction: t }
    );

    for (const [mod, chunk] of [
      [fm1, f1],
      [fm2, f2]
    ]) {
      await LgHomeFeedModuleProduct.bulkCreate(
        chunk.map((g, j) => ({
          module_id: mod.id,
          goods_id: g.id,
          shop_id: g.shop_id,
          sort: 100 - j,
          status: 1
        })),
        { transaction: t }
      );
    }

    await t.commit();
    console.log(
      `✅ 本地商城挂载表已写入：每日上新 ${daily.length}，热卖 ${top.length}，周期模块商品 ${p1.length}+${p2.length}，Feed ${f1.length}+${f2.length}`
    );
  } catch (e) {
    await t.rollback();
    console.error('❌ 失败:', e);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
