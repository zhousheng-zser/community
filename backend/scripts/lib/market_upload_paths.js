'use strict';

/**
 * 本地集市静态资源目录约定（与 restructure_market_images.js、seed 一致）：
 *   /uploads/market/{店铺分类}/{shop_no}/shop_media/{logo|cover|facade|interior|license}.{ext}
 *   /uploads/market/{店铺分类}/{shop_no}/goods/{店内分类 category_key}/{goods_no}.{ext}
 */

function pathSegment(s) {
  if (s == null || s === '') return 'uncategorized';
  const t = String(s)
    .trim()
    .replace(/[/\\:*?"<>|\u0000-\u001f]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 64);
  return t || 'uncategorized';
}

/** shop_no 一般已是 SHOPxxxx，仅去掉路径非法字符 */
function safeShopNo(shopNo) {
  const t = String(shopNo == null ? '' : shopNo)
    .trim()
    .replace(/[/\\:*?"<>|]+/g, '_');
  return t || 'shop';
}

/** @param {{ category: string, shop_no: string }} shop */
function shopUploadPrefix(shop) {
  return `/uploads/market/${pathSegment(shop.category)}/${safeShopNo(shop.shop_no)}`;
}

/** @param {{ category: string, shop_no: string }} shop @param {string} role logo|cover|... */
function shopMediaUrl(shop, role, ext) {
  const e = ext && ext.startsWith('.') ? ext : `.${ext || 'jpg'}`;
  return `${shopUploadPrefix(shop)}/shop_media/${role}${e}`;
}

/** @param {{ category: string, shop_no: string }} shop @param {string} categoryKey @param {string} goodsNo @param {string} ext */
function goodMainImageUrl(shop, categoryKey, goodsNo, ext) {
  const e = ext && ext.startsWith('.') ? ext : `.${ext || 'jpg'}`;
  return `${shopUploadPrefix(shop)}/goods/${pathSegment(categoryKey)}/${goodsNo}${e}`;
}

module.exports = {
  pathSegment,
  safeShopNo,
  shopUploadPrefix,
  shopMediaUrl,
  goodMainImageUrl
};
