/**
 * 用户绑定小区：写入资料 + 本地缓存，作为默认入口小区
 */
const api = require('../api/index.js');

const STORAGE_BOUND_COMMUNITY_ID = 'user_community_id';
const STORAGE_BOUND_COMMUNITY_NAME = 'user_community_name';

function applyBoundCommunityToApp(app, communityId, communityName) {
  const cid = Number(communityId);
  if (!Number.isFinite(cid) || cid <= 0) return;
  const g = app && app.globalData;
  if (g && g.user) {
    g.user = Object.assign({}, g.user, {
      communityId: cid,
      community_id: cid
    });
  }
  try {
    wx.setStorageSync(STORAGE_BOUND_COMMUNITY_ID, String(cid));
    if (communityName) wx.setStorageSync(STORAGE_BOUND_COMMUNITY_NAME, String(communityName));
    wx.setStorageSync('portal_location_community_id', cid);
    if (communityName) {
      wx.setStorageSync('portal_last_location_text', communityName);
    }
  } catch (e) {
    /* ignore */
  }
}

function getBoundCommunityName() {
  try {
    return wx.getStorageSync(STORAGE_BOUND_COMMUNITY_NAME) || '';
  } catch (e) {
    return '';
  }
}

/**
 * 绑定小区并同步服务端
 * @returns {Promise<{ id: number, name: string }>}
 */
async function bindCommunity(communityId, communityName) {
  const cid = Number(communityId);
  if (!Number.isFinite(cid) || cid <= 0) {
    throw new Error('无效的小区');
  }
  await api.user.updateProfileFields({ community_id: cid });
  const app = getApp();
  applyBoundCommunityToApp(app, cid, communityName || '');
  return { id: cid, name: communityName || getBoundCommunityName() };
}

module.exports = {
  STORAGE_BOUND_COMMUNITY_ID,
  STORAGE_BOUND_COMMUNITY_NAME,
  applyBoundCommunityToApp,
  getBoundCommunityName,
  bindCommunity
};
