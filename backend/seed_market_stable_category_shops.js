require('dotenv').config();
const { sequelize, MarketShop, MarketShopCategory, MarketGood } = require('./src/models');
const { shopMediaUrl, goodMainImageUrl } = require('./scripts/lib/market_upload_paths');
const { mkdirCpFromLegacy } = require('./scripts/lib/seed_mkdir_cp');
const { MARKET_CATEGORY_MAPPINGS } = require('./src/constants/marketCategoryMap');

const LEGACY_SHOP01 = {
  logo: 'market/market_shop01_logo_grocery_cart.jpg',
  cover: 'market/market_shop01_cover_fresh_vegetables.jpg',
  facade: 'market/market_shop01_facade_retail_vegetables_table.jpg',
  interior: 'market/market_shop01_interior_supermarket_food_display.jpg',
  license: 'market/market_shop01_license_office_desk_laptop.jpg'
};
const LEGACY_GOODS = 'market/market_goods_vegetable_broccoli_cauliflower_pile.jpg';

/**
 * 为“本地集市首页分类”补齐：10 个前端分类各至少创建 1 家店铺
 * 若已运行 seed_market_enrich_shops.js（每类 5 家并会删除 SHOP2001~SHOP2010），请勿再运行本脚本，否则会重新生成 10 家「官方店」并复用同套示例图。
 *
 * 约定：
 *  - stableCode 按顺序：AAAA, AAAB, AAAC, ... , AAAJ（第 1~10 个分类）
 *  - shop_no 使用：SHOP2001 ~ SHOP2010（确定性，便于幂等）
 *
 * 说明：
 *  - 本脚本只做 DB 造数/补数，不动后端业务逻辑。
 *  - 同时为每家店铺创建 1 个商品分类 + 1 个在售商品，避免前端进商品横滑为空。
 */

function pad2(n) {
  return String(n).padStart(2, '0');
}

async function main() {
  await sequelize.authenticate();

  const categories = MARKET_CATEGORY_MAPPINGS;
  if (categories.length !== 10) throw new Error('分类数量必须是 10');

  /** 合川路地铁站附近 GCJ-02 参考点（与 seed_market_data / update_shops_hechuan 一致） */
  const BASE_LAT = 31.1694;
  const BASE_LNG = 121.3783;

  const tx = await sequelize.transaction();
  try {
    for (let i = 0; i < 10; i++) {
      const category = categories[i].code;
      const categoryName = categories[i].name;
      const shopNo = `SHOP20${pad2(i + 1)}`; // SHOP2001 ~ SHOP2010（第 10 家为 SHOP2010）

      const shopName = `${categoryName}官方店`;

      const shopMeta = { category, shop_no: shopNo };
      const logoUrl = shopMediaUrl(shopMeta, 'logo', '.jpg');
      const coverUrl = shopMediaUrl(shopMeta, 'cover', '.jpg');
      const facadeUrl = shopMediaUrl(shopMeta, 'facade', '.jpg');
      const interiorUrl = shopMediaUrl(shopMeta, 'interior', '.jpg');
      const licenseUrl = shopMediaUrl(shopMeta, 'license', '.jpg');

      const dLat = ((i % 5) - 2) * 0.0012;
      const dLng = (Math.floor(i / 5) % 3 - 1) * 0.0012;

      const [shop] = await MarketShop.findOrCreate({
        where: { shop_no: shopNo },
        defaults: {
          shop_no: shopNo,
          name: shopName,
          category,
          logo_url: logoUrl,
          cover_url: coverUrl,
          notice: `示例店铺：${categoryName}`,
          delivery_type: 'platform',
          min_order_amount: 0,
          delivery_fee: 3,
          avg_delivery_minutes: 30,
          rating: 4.8,
          sold_count: 0,
          is_open: 1,
          is_active: 1,
          sort_order: 100 - i,
          address: `上海市闵行区合川路地铁站附近·${categoryName}（示例）`,
          latitude: BASE_LAT + dLat,
          longitude: BASE_LNG + dLng,
          facade_image: facadeUrl,
          interior_image: interiorUrl,
          license_image: licenseUrl,
          contact_name: '店铺联系人',
          contact_phone: '13800001111',
          business_hours: '09:00~22:00'
        },
        transaction: tx
      });

      await shop.update(
        {
          address: `上海市闵行区合川路地铁站附近·${categoryName}（示例）`,
          latitude: BASE_LAT + dLat,
          longitude: BASE_LNG + dLng,
          logo_url: logoUrl,
          cover_url: coverUrl,
          facade_image: facadeUrl,
          interior_image: interiorUrl,
          license_image: licenseUrl
        },
        { transaction: tx }
      );

      const catKey = `default_${i + 1}`;
      const catName = `${categoryName}默认分类`;

      await MarketShopCategory.findOrCreate({
        where: { shop_id: shop.id, category_key: catKey },
        defaults: {
          shop_id: shop.id,
          category_key: catKey,
          category_name: catName,
          sort_order: 100,
          is_active: 1
        },
        transaction: tx
      });

      // 给店铺创建 1 个在售商品
      const goodsNo = `G2001${pad2(i + 1)}01`;
      const mainImageUrl = goodMainImageUrl(shopMeta, catKey, goodsNo, '.jpg');
      const [gRow] = await MarketGood.findOrCreate({
        where: { goods_no: goodsNo },
        defaults: {
          goods_no: goodsNo,
          shop_id: shop.id,
          category_key: catKey,
          name: `${categoryName}畅销商品`,
          description: '示例商品，用于本地集市联调',
          main_image: mainImageUrl,
          images: null,
          price: String(10.00 + i).trim(),
          origin_price: String(12.00 + i).trim(),
          stock: 100,
          sold_count: 0,
          status: 'on_sale',
          sort_order: 100
        },
        transaction: tx
      });
      await gRow.update(
        {
          main_image: mainImageUrl,
          shop_id: shop.id,
          category_key: catKey,
          name: `${categoryName}畅销商品`,
          description: '示例商品，用于本地集市联调',
          price: String(10.00 + i).trim(),
          origin_price: String(12.00 + i).trim(),
          stock: 100,
          status: 'on_sale',
          sort_order: 100
        },
        { transaction: tx }
      );
    }

    await tx.commit();
    console.log('✅ 已补齐 10 个稳定分类店铺（AAAA~AAAJ）及其最小商品数据');

    for (let i = 0; i < 10; i++) {
      const category = categories[i].code;
      const shopNo = `SHOP20${pad2(i + 1)}`;
      const shopMeta = { category, shop_no: shopNo };
      const catKey = `default_${i + 1}`;
      const goodsNo = `G2001${pad2(i + 1)}01`;
      mkdirCpFromLegacy(shopMediaUrl(shopMeta, 'logo', '.jpg'), LEGACY_SHOP01.logo);
      mkdirCpFromLegacy(shopMediaUrl(shopMeta, 'cover', '.jpg'), LEGACY_SHOP01.cover);
      mkdirCpFromLegacy(shopMediaUrl(shopMeta, 'facade', '.jpg'), LEGACY_SHOP01.facade);
      mkdirCpFromLegacy(shopMediaUrl(shopMeta, 'interior', '.jpg'), LEGACY_SHOP01.interior);
      mkdirCpFromLegacy(shopMediaUrl(shopMeta, 'license', '.jpg'), LEGACY_SHOP01.license);
      mkdirCpFromLegacy(goodMainImageUrl(shopMeta, catKey, goodsNo, '.jpg'), LEGACY_GOODS);
    }
    console.log('✅ 已用 mkdir/cp 将示例图复制到分层目录（若源文件存在）');
  } catch (e) {
    await tx.rollback();
    console.error('❌ 补齐分类店铺失败：', e);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();

