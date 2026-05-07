/**
 * 商家端：从全局用户解析绑定店铺，商品列表 query 与按店过滤
 */
const STORAGE_KEYS = {
  shopId: 'merchant_bound_shop_id',
  shopName: 'merchant_bound_shop_name'
};

function toShopId(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return n;
  const s = String(raw).trim();
  return s || null;
}

function pickShopId(payload) {
  if (!payload || typeof payload !== 'object') return null;
  return toShopId(
    payload.shop_id != null ? payload.shop_id
      : payload.shopId != null ? payload.shopId
        : payload.id != null ? payload.id
          : payload.rawShopId
  );
}

function pickShopName(payload) {
  if (!payload || typeof payload !== 'object') return '';
  return String(
    payload.shop_name || payload.shopName || payload.shop_title || payload.shopTitle || payload.name || ''
  ).trim();
}

function getBoundShop(app) {
  const a = app || getApp();
  const u = (a && a.globalData && a.globalData.user) || {};
  const sid = pickShopId(u);
  const shopName = pickShopName(u);
  if (sid == null) {
    try {
      const cacheId = toShopId(wx.getStorageSync(STORAGE_KEYS.shopId));
      const cacheName = String(wx.getStorageSync(STORAGE_KEYS.shopName) || '').trim();
      if (cacheId != null) return { shopId: cacheId, shopName: cacheName || '' };
    } catch (e) {}
    return { shopId: null, shopName: shopName || '' };
  }
  return { shopId: sid, shopName: shopName || '' };
}

/** 从接口响应或用户对象同步店铺上下文到全局与本地缓存 */
function syncBoundShop(app, payload) {
  const a = app || getApp();
  const shopId = pickShopId(payload);
  const shopName = pickShopName(payload);
  if (shopId == null) return { shopId: null, shopName: shopName || '' };
  if (a && a.globalData && a.globalData.user) {
    a.globalData.user.shop_id = shopId;
    a.globalData.user.shopId = shopId;
    if (shopName) {
      a.globalData.user.shop_name = shopName;
      a.globalData.user.shopName = shopName;
    }
  }
  try {
    wx.setStorageSync(STORAGE_KEYS.shopId, shopId);
    if (shopName) wx.setStorageSync(STORAGE_KEYS.shopName, shopName);
  } catch (e) {}
  return { shopId, shopName: shopName || '' };
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
  syncBoundShop,
  filterGoodsByShop,
  goodsListQuery
};
