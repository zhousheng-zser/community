/**
 * 商家端：从全局用户解析绑定店铺，商品列表 query 与按店过滤
 */
function getBoundShop(app) {
  const a = app || getApp();
  const u = (a && a.globalData && a.globalData.user) || {};
  const sid = u.shop_id != null ? u.shop_id : u.shopId;
  const shopName = u.shop_name || u.shopName || u.shop_title || u.shopTitle || '';
  if (sid == null || sid === '') {
    return { shopId: null, shopName: shopName || '' };
  }
  return { shopId: sid, shopName: shopName || '' };
}

/** 接口返回含 shop_id 时，仅保留当前绑定店铺（无 shop_id 字段的旧数据仍全部保留） */
function filterGoodsByShop(raw, shopId) {
  if (!raw || !raw.length) return raw || [];
  if (shopId == null || shopId === '') return raw;
  const sid = Number(shopId);
  if (!Number.isFinite(sid)) return raw;
  const hasAnyShop = raw.some((g) => {
    const id = g.shop_id != null ? g.shop_id : g.shopId;
    return id != null && id !== '';
  });
  if (!hasAnyShop) return raw;
  return raw.filter((g) => {
    const gid = g.shop_id != null ? g.shop_id : g.shopId;
    if (gid == null || gid === '') return false;
    return Number(gid) === sid;
  });
}

function goodsListQuery(shopId) {
  const p = { page: 1, limit: 200 };
  if (shopId != null && shopId !== '') {
    p.shop_id = shopId;
    p.shopId = shopId;
  }
  return p;
}

module.exports = {
  getBoundShop,
  filterGoodsByShop,
  goodsListQuery
};
