/** 切换账号时清理非用户隔离的本地缓存，避免串号 */
const checkoutStorage = require('./checkoutStorage.js');

const KEYS = [
  'checkout_selected_coupon',
  'merchant_token',
  'service_provider_token',
  'temp_checkout_items',
  'sp_bundle_checkout'
];

function clearAccountScopedStorage() {
  KEYS.forEach((key) => {
    try { wx.removeStorageSync(key); } catch (e) { /* ignore */ }
  });
  checkoutStorage.clearCheckout();
}

module.exports = { clearAccountScopedStorage };
