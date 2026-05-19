/** 集市本地结算缓存（按当前登录用户隔离） */
const userSession = require('./userSession.js');

const BASE = {
  goods: 'local_checkout_goods',
  total: 'local_checkout_totle',
  shopId: 'local_checkout_shop_id',
  shopName: 'local_checkout_shop_name'
};

function k(name) {
  return userSession.scopedStorageKey(BASE[name] || name);
}

function saveCheckout({ goods, total, shopId, shopName }) {
  if (goods != null) wx.setStorageSync(k('goods'), goods);
  if (total != null) wx.setStorageSync(k('total'), total);
  if (shopId != null) wx.setStorageSync(k('shopId'), shopId);
  if (shopName != null) wx.setStorageSync(k('shopName'), shopName);
}

function loadCheckout() {
  return {
    goods: wx.getStorageSync(k('goods')) || [],
    total: wx.getStorageSync(k('total')),
    shopId: wx.getStorageSync(k('shopId')),
    shopName: wx.getStorageSync(k('shopName')) || ''
  };
}

function clearCheckout() {
  Object.keys(BASE).forEach((name) => {
    try { wx.removeStorageSync(k(name)); } catch (e) { /* ignore */ }
  });
}

module.exports = {
  saveCheckout,
  loadCheckout,
  clearCheckout
};
