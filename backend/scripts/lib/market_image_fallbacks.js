'use strict';

/**
 * 迁移脚本用：库中路径指向的文件不存在时，从扁平示例图回退复制。
 * 相对路径均相对于 data/uploads/images。
 */
const shopMediaFallbackRel = {
  logo: 'market/market_shop01_logo_grocery_cart.jpg',
  cover: 'market/market_shop01_cover_fresh_vegetables.jpg',
  facade: 'market/market_shop01_facade_retail_vegetables_table.jpg',
  interior: 'market/market_shop01_interior_supermarket_food_display.jpg',
  license: 'market/market_shop01_license_office_desk_laptop.jpg'
};

/** 与 seed_market_data 一致 */
const goodsFallbackRelByGoodsNo = {
  G1001001: 'market/market_goods_vegetable_broccoli_cauliflower_pile.jpg',
  G1001002: 'market/market_goods_meat_raw_steak_board.jpg',
  G1001003: 'market/market_goods_fruit_pears_in_basket.jpg',
  G1002001: 'market/market_goods_snack_fried_appetizer.jpg',
  G1002002: 'market/market_goods_noodle_pizza_slice_style.jpg',
  G1003001: 'market/market_goods_grains_rice_field_green.jpg',
  G1003002: 'market/market_goods_sausage_dried_goods_stall.jpg'
};

const g2001SeriesDefaultRel = 'market/market_goods_vegetable_broccoli_cauliflower_pile.jpg';

module.exports = {
  shopMediaFallbackRel,
  goodsFallbackRelByGoodsNo,
  g2001SeriesDefaultRel
};
