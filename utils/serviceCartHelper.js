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

async function addToCart({ providerId, serviceId, groupKey, quantity = 1 }) {
  if (!ensureLogin()) return { ok: false, needLogin: true };
  const provider_id = Number(providerId);
  const service_id = Number(serviceId);
  if (!provider_id || !service_id) {
    wx.showToast({ title: '服务信息不完整', icon: 'none' });
    return { ok: false };
  }
  await api.serviceCart.addToCart({
    provider_id,
    service_id,
    group_key: groupKey || 'default',
    quantity: Math.max(1, Math.min(Number(quantity) || 1, 999))
  });
  markCartDirty();
  return { ok: true };
}

async function fetchCartItemCount() {
  if (!wx.getStorageSync('token')) return 0;
  try {
    const data = unwrapData(await api.serviceCart.getCartSummary());
    return Number(data.item_count || 0);
  } catch (e) {
    return 0;
  }
}

function buildGroupsFromList(list) {
  const byProvider = new Map();
  (list || []).forEach((item) => {
    const pid = Number(item.provider_id);
    if (!pid) return;
    if (!byProvider.has(pid)) {
      byProvider.set(pid, {
        provider_id: pid,
        provider_name: item.provider_name || '服务商',
        items: [],
        subtotal: '0.00',
        item_count: 0
      });
    }
    const g = byProvider.get(pid);
    g.items.push(item);
    if (!item.invalid) {
      g.item_count += Number(item.quantity || 0);
      g.subtotal = (Number(g.subtotal) + Number(item.subtotal || 0)).toFixed(2);
    }
  });
  return Array.from(byProvider.values());
}

async function fetchCartGroups() {
  if (!wx.getStorageSync('token')) return { groups: [], summary: { item_count: 0, sku_count: 0, provider_count: 0 } };
  const data = unwrapData(await api.serviceCart.getCart());
  const list = Array.isArray(data.list) ? data.list : [];
  let groups = Array.isArray(data.groups) ? data.groups : [];
  if (!groups.length && list.length) groups = buildGroupsFromList(list);
  groups = groups.map((g) => {
    const items = Array.isArray(g.items) && g.items.length ? g.items : list.filter((it) => Number(it.provider_id) === Number(g.provider_id));
    return { ...g, items };
  });
  return {
    groups,
    list,
    summary: data.summary || { item_count: 0, sku_count: 0, provider_count: 0 }
  };
}

async function updateItemQty(itemId, quantity) {
  const res = await api.serviceCart.updateCartItem(itemId, { quantity });
  markCartDirty();
  return unwrapData(res);
}

async function removeItem(itemId) {
  const res = await api.serviceCart.deleteCartItem(itemId);
  markCartDirty();
  return unwrapData(res);
}

async function clearProviderCart(providerId) {
  const res = await api.serviceCart.clearCart(providerId);
  markCartDirty();
  return unwrapData(res);
}

async function clearAllCart() {
  const res = await api.serviceCart.clearCart();
  markCartDirty();
  return unwrapData(res);
}

function decorateGroup(group) {
  const items = (group.items || []).map((it) => {
    const rawImg = (it.service && (it.service.cover_image || it.service.image)) || '';
    const id = it.id;
    return {
      id,
      provider_id: it.provider_id,
      service_id: it.service_id,
      group_key: it.group_key || 'default',
      quantity: it.quantity,
      subtotal: it.subtotal,
      invalid: !!it.invalid,
      cartRowKey: `sc-${id}`,
      serviceName: (it.service && it.service.title) || '服务已失效',
      serviceImage: rawImg ? util.imgUrl(rawImg) : '',
      servicePrice: (it.service && it.service.price) || '0'
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
  const items = (group.items || [])
    .filter((it) => !it.invalid && Number(it.quantity) > 0)
    .map((it) => ({
      service_id: it.service_id,
      group_key: it.group_key || 'default',
      qty: it.quantity,
      title: it.serviceName,
      price: it.servicePrice
    }));
  return {
    provider_id: group.provider_id,
    provider_name: group.provider_name || '服务商',
    items
  };
}

module.exports = {
  ensureLogin,
  markCartDirty,
  addToCart,
  fetchCartItemCount,
  fetchCartGroups,
  updateItemQty,
  removeItem,
  clearProviderCart,
  clearAllCart,
  decorateGroup,
  buildCheckoutPayload
};
