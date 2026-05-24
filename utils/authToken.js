/**
 * 读取登录 token（storage 为准；与 util.request、communityBind 共用）
 */
function getAuthToken() {
  try {
    const t = wx.getStorageSync('token');
    if (t != null && String(t).trim() !== '') return String(t).trim();
  } catch (e) {
    /* ignore */
  }
  return '';
}

function hasAuthToken() {
  return !!getAuthToken();
}

module.exports = {
  getAuthToken,
  hasAuthToken
};
