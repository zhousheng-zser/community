#!/usr/bin/env node
/**
 * 填充本地市场店铺分类数据 seedShopCategories.js
 *
 * 用法: node backend/scripts/seedShopCategories.js
 */
'use strict';

const path = require('path');
process.chdir(path.resolve(__dirname, '..'));

const db = require('../src/models');
const { MerchantShop, MarketShopCategory } = db;

const DEFAULT_CATEGORIES = [
  { category_key: 'snack', category_name: '食品生鲜', sort_order: 1 },
  { category_key: 'drink', category_name: '酒水饮料', sort_order: 2 },
  { category_key: 'fruits', category_name: '新鲜水果', sort_order: 3 },
  { category_key: 'daily', category_name: '日用百货', sort_order: 4 },
  { category_key: 'hot_sale', category_name: '热销爆款', sort_order: 5 }
];

async function run() {
  // 1. 同步数据库结构
  await MarketShopCategory.sync();
  console.log('[OK] MarketShopCategory 表结构已同步');

  // 2. 获取所有店铺
  const shops = await MerchantShop.findAll();
  if (shops.length === 0) {
    console.log('[WARN] 当前数据库中暂无店铺信息，请先注册/入驻店铺后再试。');
    await db.sequelize.close();
    return;
  }

  console.log(`[INFO] 发现 ${shops.length} 个店铺，开始填充店内分类数据...`);

  // 3. 填充分类数据
  for (const shop of shops) {
    console.log(`\n--- 店铺: ${shop.name} (ID: ${shop.id}) ---`);
    for (const cat of DEFAULT_CATEGORIES) {
      const [row, created] = await MarketShopCategory.findOrCreate({
        where: { shop_id: shop.id, category_key: cat.category_key },
        defaults: {
          category_name: cat.category_name,
          sort_order: cat.sort_order
        }
      });
      if (created) {
        console.log(`[CREATED] 分类: ${cat.category_name} (${cat.category_key}) 已创建`);
      } else {
        console.log(`[EXISTS] 分类: ${cat.category_name} (${cat.category_key}) 已存在`);
      }
    }
  }

  await db.sequelize.close();
  console.log('\n[SUCCESS] 店内分类数据填充完成！');
}

run().catch(e => {
  console.error('[ERROR] 种子填充失败:', e);
  process.exit(1);
});
