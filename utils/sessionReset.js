/** 切换账号时清理非用户隔离的本地缓存，避免串号 */
const KEYS = [
  'checkout_selected_coupon',
  'merchant_token',
  'service_provider_token',
  'local_checkout_goods',
  'local_checkout_totle',
  'local_checkout_shop_id',
  'local_checkout_shop_name',
  'sp_bundle_checkout'
];

function clearAccountScopedStorage() {
  KEYS.forEach((key) => {
    try { wx.removeStorageSync(key); } catch (e) { /* ignore */ }
  });
}

module.exports = { clearAccountScopedStorage };
