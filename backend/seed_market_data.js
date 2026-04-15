require('dotenv').config();
const { sequelize, MarketShop, MarketShopCategory, MarketGood } = require('./src/models');
const { shopMediaUrl, goodMainImageUrl } = require('./scripts/lib/market_upload_paths');
const { mkdirCpFromLegacy } = require('./scripts/lib/seed_mkdir_cp');

/** 扁平示例图 → 复制到分层路径（相对 data/uploads/images） */
const SHOP_LEGACY_FILES = {
  SHOP1001: {
    logo: 'market/market_shop01_logo_grocery_cart.jpg',
    cover: 'market/market_shop01_cover_fresh_vegetables.jpg',
    facade: 'market/market_shop01_facade_retail_vegetables_table.jpg',
    interior: 'market/market_shop01_interior_supermarket_food_display.jpg',
    license: 'market/market_shop01_license_office_desk_laptop.jpg'
  },
  SHOP1002: {
    logo: 'market/market_shop02_logo_colorful_vegetables.jpg',
    cover: 'market/market_shop02_cover_pizza_food_top.jpg',
    facade: 'market/market_shop02_facade_restaurant_food_closeup.jpg',
    interior: 'market/market_shop02_interior_modern_kitchen.jpg',
    license: 'market/market_shop02_license_office_workplace.jpg'
  },
  SHOP1003: {
    logo: 'market/market_shop03_logo_green_farmland.jpg',
    cover: 'market/market_shop03_cover_market_stall_produce.jpg',
    facade: 'market/market_shop03_facade_fresh_produce_table.jpg',
    interior: 'market/market_shop03_interior_market_shelves.jpg',
    license: 'market/market_shop03_license_office_documents.jpg'
  }
};

const GOODS_LEGACY_FILES = {
  G1001001: 'market/market_goods_vegetable_broccoli_cauliflower_pile.jpg',
  G1001002: 'market/market_goods_meat_raw_steak_board.jpg',
  G1001003: 'market/market_goods_fruit_pears_in_basket.jpg',
  G1002001: 'market/market_goods_snack_fried_appetizer.jpg',
  G1002002: 'market/market_goods_noodle_pizza_slice_style.jpg',
  G1003001: 'market/market_goods_grains_rice_field_green.jpg',
  G1003002: 'market/market_goods_sausage_dried_goods_stall.jpg'
};

function applyShopImagePaths(p) {
  const m = { category: p.category, shop_no: p.shop_no };
  p.logo_url = shopMediaUrl(m, 'logo', '.jpg');
  p.cover_url = shopMediaUrl(m, 'cover', '.jpg');
  p.facade_image = shopMediaUrl(m, 'facade', '.jpg');
  p.interior_image = shopMediaUrl(m, 'interior', '.jpg');
  p.license_image = shopMediaUrl(m, 'license', '.jpg');
}

async function main() {
  try {
    await sequelize.authenticate();

    const shopsPayload = [
      {
        shop_no: 'SHOP1001',
        name: '邻里生鲜超市',
        category: 'AAAG',
        notice: '满39元免配送费',
        delivery_type: 'platform',
        min_order_amount: 20,
        delivery_fee: 3,
        avg_delivery_minutes: 30,
        rating: 4.9,
        sold_count: 3210,
        is_open: 1,
        is_active: 1,
        sort_order: 100,
        address: '上海市闵行区合川路地铁站附近·邻里生鲜（示例）',
        latitude: 31.1694,
        longitude: 121.3783,
        contact_name: '张老板',
        contact_phone: '13800001111',
        business_hours: '09:00~22:00'
      },
      {
        shop_no: 'SHOP1002',
        name: '社区便民小吃',
        category: 'AAAD',
        notice: '现做小吃，热乎送达',
        delivery_type: 'merchant',
        min_order_amount: 0,
        delivery_fee: 5,
        avg_delivery_minutes: 40,
        rating: 4.7,
        sold_count: 980,
        is_open: 1,
        is_active: 1,
        sort_order: 80,
        address: '上海市闵行区合川路地铁站附近·社区便民小吃（示例）',
        latitude: 31.1702,
        longitude: 121.379,
        contact_name: '李老板',
        contact_phone: '13900002222',
        business_hours: '10:00~23:00'
      },
      {
        shop_no: 'SHOP1003',
        name: '农家土特产馆',
        category: 'AAAC',
        notice: '来自乡下的味道',
        delivery_type: 'platform',
        min_order_amount: 50,
        delivery_fee: 0,
        avg_delivery_minutes: 60,
        rating: 4.8,
        sold_count: 560,
        is_open: 1,
        is_active: 1,
        sort_order: 60,
        address: '上海市闵行区合川路地铁站附近·农家土特产馆（示例）',
        latitude: 31.1686,
        longitude: 121.3775,
        contact_name: '王老板',
        contact_phone: '13700003333',
        business_hours: '08:00~20:00'
      }
    ];

    for (const p of shopsPayload) applyShopImagePaths(p);

    const categoriesByShopNo = {
      SHOP1001: [
        { category_key: 'vegetable', category_name: '有机蔬菜', sort_order: 100 },
        { category_key: 'meat', category_name: '鲜猪牛羊肉', sort_order: 90 },
        { category_key: 'fruit', category_name: '新鲜水果', sort_order: 80 }
      ],
      SHOP1002: [
        { category_key: 'snack', category_name: '招牌小吃', sort_order: 100 },
        { category_key: 'noodle', category_name: '粉面主食', sort_order: 90 }
      ],
      SHOP1003: [
        { category_key: 'rice_noodle', category_name: '米面粮油', sort_order: 100 },
        { category_key: 'local', category_name: '本地土特产', sort_order: 90 }
      ]
    };

    const goodsByShopNo = {
      SHOP1001: [
        {
          goods_no: 'G1001001',
          category_key: 'vegetable',
          name: '当季有机西蓝花 500g',
          description: '当天采摘，冷链直达',
          price: 6.8,
          origin_price: 8.8,
          stock: 200,
          sort_order: 100
        },
        {
          goods_no: 'G1001002',
          category_key: 'meat',
          name: '冷鲜前腿肉 500g',
          description: '现切冷鲜猪肉',
          price: 18.9,
          origin_price: 22.9,
          stock: 120,
          sort_order: 95
        },
        {
          goods_no: 'G1001003',
          category_key: 'fruit',
          name: '新疆脆甜香梨 4斤装',
          description: '香甜多汁，现货秒发',
          price: 29.9,
          origin_price: 39.9,
          stock: 60,
          sort_order: 90
        }
      ],
      SHOP1002: [
        {
          goods_no: 'G1002001',
          category_key: 'snack',
          name: '手工豆腐串（5串）',
          description: '现炸现卖，小朋友最爱',
          price: 6.8,
          origin_price: 8.0,
          stock: 500,
          sort_order: 100
        },
        {
          goods_no: 'G1002002',
          category_key: 'noodle',
          name: '红烧牛肉面',
          description: '秘制汤底，香浓不腻',
          price: 18.8,
          origin_price: 22.0,
          stock: 200,
          sort_order: 95
        }
      ],
      SHOP1003: [
        {
          goods_no: 'G1003001',
          category_key: 'rice_noodle',
          name: '农家自种寒地大米 5kg',
          description: '东北寒地种植，口感软糯',
          price: 59.9,
          origin_price: 79.9,
          stock: 80,
          sort_order: 100
        },
        {
          goods_no: 'G1003002',
          category_key: 'local',
          name: '手工腊肠 500g',
          description: '传统工艺晾晒，香味十足',
          price: 39.9,
          origin_price: 49.9,
          stock: 50,
          sort_order: 95
        }
      ]
    };

    const shopCategoryByNo = Object.fromEntries(shopsPayload.map((p) => [p.shop_no, p.category]));
    for (const [shopNo, goodsList] of Object.entries(goodsByShopNo)) {
      const cat = shopCategoryByNo[shopNo];
      for (const g of goodsList) {
        g.main_image = goodMainImageUrl({ category: cat, shop_no: shopNo }, g.category_key, g.goods_no, '.jpg');
      }
    }

    const t = await sequelize.transaction();
    try {
      const shopMap = {};
      for (const payload of shopsPayload) {
        const [shop] = await MarketShop.findOrCreate({
          where: { shop_no: payload.shop_no },
          defaults: payload,
          transaction: t
        });
        await shop.update(
          {
            latitude: payload.latitude,
            longitude: payload.longitude,
            logo_url: payload.logo_url,
            facade_image: payload.facade_image,
            interior_image: payload.interior_image,
            license_image: payload.license_image,
            cover_url: payload.cover_url,
            address: payload.address,
            business_hours: payload.business_hours
          },
          { transaction: t }
        );
        shopMap[payload.shop_no] = shop;
      }

      for (const [shopNo, cats] of Object.entries(categoriesByShopNo)) {
        const shop = shopMap[shopNo];
        if (!shop) continue;
        for (const cat of cats) {
          await MarketShopCategory.findOrCreate({
            where: { shop_id: shop.id, category_key: cat.category_key },
            defaults: { ...cat, shop_id: shop.id },
            transaction: t
          });
        }
      }

      for (const [shopNo, goodsList] of Object.entries(goodsByShopNo)) {
        const shop = shopMap[shopNo];
        if (!shop) continue;
        for (const g of goodsList) {
          const { main_image, ...rest } = g;
          const [row] = await MarketGood.findOrCreate({
            where: { goods_no: g.goods_no },
            defaults: { ...rest, main_image, shop_id: shop.id },
            transaction: t
          });
          await row.update(
            { main_image, shop_id: shop.id, ...rest },
            { transaction: t }
          );
        }
      }

      await t.commit();
      console.log('✅ 本地集市示例店铺/分类/商品数据插入完成');

      for (const p of shopsPayload) {
        const L = SHOP_LEGACY_FILES[p.shop_no];
        if (!L) continue;
        mkdirCpFromLegacy(p.logo_url, L.logo);
        mkdirCpFromLegacy(p.cover_url, L.cover);
        mkdirCpFromLegacy(p.facade_image, L.facade);
        mkdirCpFromLegacy(p.interior_image, L.interior);
        mkdirCpFromLegacy(p.license_image, L.license);
      }
      for (const g of Object.values(goodsByShopNo).flat()) {
        const leg = GOODS_LEGACY_FILES[g.goods_no];
        if (leg) mkdirCpFromLegacy(g.main_image, leg);
      }
      console.log('✅ 已用 mkdir/cp 将扁平示例图复制到分层目录（若源文件存在）');
    } catch (err) {
      await t.rollback();
      console.error('❌ 插入示例数据失败:', err);
    }
  } catch (e) {
    console.error('DB init failed:', e);
  } finally {
    await sequelize.close();
  }
}

main();
