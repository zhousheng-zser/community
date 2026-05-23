/**
 * 集市购物车统一封装（前后端对齐）
 * 表：market_cart_items(user_id, shop_id, goods_id, quantity)
 */
const api = require('../api/index.js');
const util = require('./util.js');

function ensureLogin() {
  if (wx.getStorageSync('token')) return true;
  wx.showToast({ title: '请先登录', icon: 'none' });
  setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 500);
  return false;
}

function markCartDirty() {
  try {
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.cartRevision = (app.globalData.cartRevision || 0) + 1;
    }
  } catch (e) { /* ignore */ }
}

function unwrapData(res) {
  if (!res || typeof res !== 'object') return {};
  return res.data !== undefined ? res.data : res;
}

async function addToCart({ shopId, goodsId, quantity = 1 }) {
  if (!ensureLogin()) return { ok: false, needLogin: true };
  const shop_id = Number(shopId);
  const goods_id = Number(goodsId);
  if (!shop_id || !goods_id) {
    wx.showToast({ title: '商品信息不完整', icon: 'none' });
    return { ok: false };
  }
  await api.market.addToCart({
    shop_id,
    goods_id,
    quantity: Math.max(1, Math.min(Number(quantity) || 1, 999))
  });
  markCartDirty();
  return { ok: true };
}

async function fetchCartItemCount() {
  if (!wx.getStorageSync('token')) return 0;
  try {
    const data = unwrapData(await api.market.getCartSummary());
    return Number(data.item_count || 0);
  } catch (e) {
    return 0;
  }
}

async function fetchCartGroups() {
  if (!wx.getStorageSync('token')) return { groups: [], summary: { item_count: 0, sku_count: 0, shop_count: 0 } };
  const data = unwrapData(await api.market.getCart());
  return {
    groups: Array.isArray(data.groups) ? data.groups : [],
    list: Array.isArray(data.list) ? data.list : [],
    summary: data.summary || { item_count: 0, sku_count: 0, shop_count: 0 }
  };
}

async function fetchShopCart(shopId) {
  if (!wx.getStorageSync('token') || !shopId) return { list: [] };
  const data = unwrapData(await api.market.getCart(shopId));
  return { list: Array.isArray(data.list) ? data.list : [] };
}

async function updateItemQty(itemId, quantity) {
  const res = await api.market.updateCartItem(itemId, { quantity });
  markCartDirty();
  return unwrapData(res);
}

async function removeItem(itemId) {
  const res = await api.market.deleteCartItem(itemId);
  markCartDirty();
  return unwrapData(res);
}

async function clearShopCart(shopId) {
  const res = await api.market.clearCart(shopId);
  markCartDirty();
  return unwrapData(res);
}

async function clearAllCart() {
  const res = await api.market.clearCart();
  markCartDirty();
  return unwrapData(res);
}

function decorateGroup(group) {
  const items = (group.items || []).map((it) => {
    const rawImg = (it.goods && (it.goods.image || it.goods.main_image)) || '';
    const id = it.id;
    return {
      id,
      shop_id: it.shop_id,
      goods_id: it.goods_id,
      quantity: it.quantity,
      subtotal: it.subtotal,
      invalid: !!it.invalid,
      cartRowKey: `mc-${id}`,
      goodsName: (it.goods && (it.goods.title || it.goods.name)) || '商品已失效',
      goodsImage: rawImg ? util.imgUrl(rawImg) : '',
      goodsPrice: (it.goods && it.goods.price) || '0'
    };
  });
  const validItems = items.filter((it) => !it.invalid);
  const subtotal = validItems.reduce((s, it) => s + Number(it.subtotal || 0), 0).toFixed(2);
  const itemCount = validItems.reduce((s, it) => s + Number(it.quantity || 0), 0);
  return {
    ...group,
    items,
    subtotal,
    item_count: itemCount,
    canSettle: itemCount > 0
  };
}

function buildCheckoutPayload(group) {
  const cartItems = (group.items || [])
    .filter((it) => !it.invalid && Number(it.quantity) > 0)
    .map((it) => ({
      goodsId: it.goods_id,
      goodsPictureUrl: it.goodsImage,
      goodsName: it.goodsName,
      goodsBrief: '默认规格',
      goodsRealPrice: Number(it.goodsPrice) || 0,
      goodsNum: it.quantity
    }));
  return {
    goods: cartItems,
    total: group.subtotal,
    shopId: group.shop_id,
    shopName: group.shop_name || ''
  };
}

module.exports = {
  ensureLogin,
  markCartDirty,
  addToCart,
  fetchCartItemCount,
  fetchCartGroups,
  fetchShopCart,
  updateItemQty,
  removeItem,
  clearShopCart,
  clearAllCart,
  decorateGroup,
  buildCheckoutPayload
};
