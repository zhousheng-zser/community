/** 切换账号时清理本地缓存，避免串号 */
const checkoutStorage = require('./checkoutStorage.js');
const userSession = require('./userSession.js');

const SCOPED_KEYS = [
  'checkout_selected_coupon',
  'merchant_token',
  'service_provider_token',
  'temp_checkout_items',
  'sp_bundle_checkout'
];

const USER_SESSION_KEYS = [
  'token',
  'login_channel',
  'user',
  'user_community_id',
  'community_id',
  'address_list'
];

function clearAccountScopedStorage() {
  SCOPED_KEYS.forEach((key) => {
    try { wx.removeStorageSync(key); } catch (e) { /* ignore */ }
  });
  checkoutStorage.clearCheckout();
}

/** 清除登录态与用户相关缓存（换微信 / 会话失效时） */
function clearAllUserSession() {
  clearAccountScopedStorage();
  USER_SESSION_KEYS.forEach((key) => {
    try { wx.removeStorageSync(key); } catch (e) { /* ignore */ }
  });
  userSession.clearRememberedUserId();
}

module.exports = { clearAccountScopedStorage, clearAllUserSession };
