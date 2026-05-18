/**
 * 当前登录用户会话：用于按 userId 隔离本地 Storage，避免切换账号后看到上一账号的足迹/收藏等
 */

const LAST_USER_ID_KEY = 'last_user_id';

function getCurrentUserId() {
  try {
    const app = getApp();
    const u = app && app.globalData && app.globalData.user;
    if (u && u.id != null && u.id !== '') return String(u.id);
  } catch (e) { /* getApp 未就绪 */ }
  try {
    const last = wx.getStorageSync(LAST_USER_ID_KEY);
    if (last != null && last !== '') return String(last);
  } catch (e) { /* ignore */ }
  return 'guest';
}

function scopedStorageKey(baseKey) {
  return `${baseKey}_u${getCurrentUserId()}`;
}

function rememberUserId(userId) {
  if (userId == null || userId === '') return;
  try {
    wx.setStorageSync(LAST_USER_ID_KEY, String(userId));
  } catch (e) { /* ignore */ }
}

function clearRememberedUserId() {
  try {
    wx.removeStorageSync(LAST_USER_ID_KEY);
  } catch (e) { /* ignore */ }
}

module.exports = {
  LAST_USER_ID_KEY,
  getCurrentUserId,
  scopedStorageKey,
  rememberUserId,
  clearRememberedUserId
};
