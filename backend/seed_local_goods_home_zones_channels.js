/**
 * 金刚区 zone_id 1～4 + 导购 channel_key 三频道灌数（来源 market_goods，店铺须有经纬度）。
 * 依赖：已 sync_db；建议先跑 seed_local_goods_home.js。
 *
 * 用法：node seed_local_goods_home_zones_channels.js
 */
require('dotenv').config();
const { Op } = require('sequelize');
const {
  sequelize,
  MarketGood,
  MarketShop,
  LgHomeZone,
  LgHomeZoneProduct,
  LgHomeZoneGiftSubcategory,
  LgHomeZoneSidebarCategory,
  LgHomeChannel,
  LgHomeChannelProduct,
  LgHomeChannelTab,
  LgHomeChannelTabProduct
} = require('./src/models');

async function loadGoodsPool() {
  const goods = await MarketGood.findAll({
    where: { status: 'on_sale' },
    order: [['id', 'ASC']],
    limit: 300
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
  return goods.filter((g) => okShop.has(Number(g.shop_id)));
}

async function main() {
  await sequelize.authenticate();
  const pool = await loadGoodsPool();
  if (pool.length < 10) {
    console.error('❌ 可用商品过少，请先灌集市店铺商品。');
    process.exitCode = 1;
    return;
  }

  let cursor = 0;
  const take = (n) => {
    const out = [];
    for (let k = 0; k < n; k += 1) {
      out.push(pool[cursor % pool.length]);
      cursor += 1;
    }
    return out;
  };

  const t = await sequelize.transaction();
  try {
    await LgHomeChannelTabProduct.destroy({ where: {}, transaction: t });
    await LgHomeChannelTab.destroy({ where: {}, transaction: t });
    await LgHomeChannelProduct.destroy({ where: {}, transaction: t });
    await LgHomeChannel.destroy({ where: {}, transaction: t });
    await LgHomeZoneProduct.destroy({ where: {}, transaction: t });
    await LgHomeZoneGiftSubcategory.destroy({ where: {}, transaction: t });
    await LgHomeZoneSidebarCategory.destroy({ where: {}, transaction: t });
    await LgHomeZone.destroy({ where: {}, transaction: t });

    await LgHomeZone.bulkCreate(
      [
        { id: 1, zone_code: 'hot', name: '爆款专区', sort: 100, status: 1 },
        { id: 2, zone_code: 'gift', name: '礼物专区', sort: 90, status: 1 },
        { id: 3, zone_code: 'pick', name: '本地好物甄选', sort: 80, status: 1 },
        { id: 4, zone_code: 'high_comm', name: '高佣专区', sort: 70, status: 1 }
      ],
      { transaction: t }
    );

    await LgHomeZoneGiftSubcategory.bulkCreate(
      [
        { zone_id: 2, sub_code: 'elder', name: '送长辈', cover_image: '/uploads/market/_vjshi_import/import_0001.jpg', sort: 100, status: 1 },
        { zone_id: 2, sub_code: 'friend', name: '送朋友', cover_image: '/uploads/market/_vjshi_import/import_0002.jpg', sort: 90, status: 1 }
      ],
      { transaction: t }
    );

    await LgHomeZoneSidebarCategory.bulkCreate(
      [
        { zone_id: 3, category_name: '家庭清洁', sort: 100, status: 1 },
        { zone_id: 3, category_name: '生鲜水果', sort: 90, status: 1 }
      ],
      { transaction: t }
    );

    const z1 = take(10);
    await LgHomeZoneProduct.bulkCreate(
      z1.map((g, j) => ({
        zone_id: 1,
        goods_id: g.id,
        shop_id: g.shop_id,
        sort: 100 - j,
        status: 1
      })),
      { transaction: t }
    );

    const z2part1 = take(8);
    await LgHomeZoneProduct.bulkCreate(
      z2part1.map((g, j) => {
        const mod = j % 3;
        const gift_sub_code = mod === 0 ? null : mod === 1 ? '送长辈' : '送朋友';
        return {
          zone_id: 2,
          goods_id: g.id,
          shop_id: g.shop_id,
          gift_sub_code,
          sort: 100 - j,
          status: 1
        };
      }),
      { transaction: t }
    );

    const z3 = take(8);
    await LgHomeZoneProduct.bulkCreate(
      z3.map((g, j) => ({
        zone_id: 3,
        goods_id: g.id,
        shop_id: g.shop_id,
        sidebar_category: j % 2 === 0 ? '家庭清洁' : '生鲜水果',
        sort: 100 - j,
        status: 1
      })),
      { transaction: t }
    );

    const z4 = take(8);
    await LgHomeZoneProduct.bulkCreate(
      z4.map((g, j) => ({
        zone_id: 4,
        goods_id: g.id,
        shop_id: g.shop_id,
        sort: 100 - j,
        status: 1
      })),
      { transaction: t }
    );

    const chBrand = await LgHomeChannel.create(
      { channel_key: 'brand_goods', title: '品牌好货', sort: 100, status: 1 },
      { transaction: t }
    );
    const chJiu = await LgHomeChannel.create(
      { channel_key: 'jiuzhou_haowu', title: '寻找九州好物', sort: 90, status: 1 },
      { transaction: t }
    );
    const chAutumn = await LgHomeChannel.create(
      { channel_key: 'autumn_winter', title: '秋冬好物', sort: 80, status: 1 },
      { transaction: t }
    );

    const bGoods = take(12);
    await LgHomeChannelProduct.bulkCreate(
      bGoods.map((g, j) => ({
        channel_id: chBrand.id,
        goods_id: g.id,
        shop_id: g.shop_id,
        sort: 100 - j,
        status: 1
      })),
      { transaction: t }
    );

    const aGoods = take(12);
    await LgHomeChannelProduct.bulkCreate(
      aGoods.map((g, j) => ({
        channel_id: chAutumn.id,
        goods_id: g.id,
        shop_id: g.shop_id,
        sort: 100 - j,
        status: 1
      })),
      { transaction: t }
    );

    const tab1 = await LgHomeChannelTab.create(
      { channel_id: chJiu.id, tab_name: '九州好食', sort: 100, status: 1 },
      { transaction: t }
    );
    const tab2 = await LgHomeChannelTab.create(
      { channel_id: chJiu.id, tab_name: '九州好味', sort: 90, status: 1 },
      { transaction: t }
    );
    const tab3 = await LgHomeChannelTab.create(
      { channel_id: chJiu.id, tab_name: '九州好物', sort: 80, status: 1 },
      { transaction: t }
    );

    for (const [tab, n] of [
      [tab1, 6],
      [tab2, 6],
      [tab3, 6]
    ]) {
      const chunk = take(n);
      await LgHomeChannelTabProduct.bulkCreate(
        chunk.map((g, j) => ({
          tab_id: tab.id,
          goods_id: g.id,
          shop_id: g.shop_id,
          sort: 100 - j,
          status: 1
        })),
        { transaction: t }
      );
    }

    await t.commit();
    console.log('✅ 金刚区专区 + 导购频道挂载数据已写入');
  } catch (e) {
    await t.rollback();
    console.error('❌ 失败:', e);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
