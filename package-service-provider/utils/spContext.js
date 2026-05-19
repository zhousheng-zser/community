/**
 * 直约服务商端：从全局用户解析绑定的服务商 profile，管理 profile_id 上下文
 * 参考 merchantShopContext.js 实现
 */
const STORAGE_KEYS = {
  profileId: 'sp_bound_profile_id',
  shopName: 'sp_bound_shop_name'
};

function toProfileId(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return n;
  return null;
}

function pickProfileId(payload) {
  if (!payload || typeof payload !== 'object') return null;
  return toProfileId(
    payload.profile_id != null ? payload.profile_id
      : payload.profileId != null ? payload.profileId
        : payload.sp_profile_id != null ? payload.sp_profile_id
          : payload.service_provider_profile_id != null ? payload.service_provider_profile_id
            : payload.id != null ? payload.id
              : null
  );
}

function pickShopName(payload) {
  if (!payload || typeof payload !== 'object') return '';
  return String(
    payload.shop_name || payload.shopName || payload.name || ''
  ).trim();
}

/** 获取当前服务商 profile 上下文 */
function getBoundProfile(app) {
  const a = app || getApp();
  const u = (a && a.globalData && a.globalData.user) || {};
  const pid = pickProfileId(u);
  const shopName = pickShopName(u);
  if (pid == null) {
    try {
      const cacheId = toProfileId(wx.getStorageSync(STORAGE_KEYS.profileId));
      const cacheName = String(wx.getStorageSync(STORAGE_KEYS.shopName) || '').trim();
      if (cacheId != null) return { profileId: cacheId, id: cacheId, shopName: cacheName || '' };
    } catch (e) {}
    return { profileId: null, id: null, shopName: shopName || '' };
  }
  return { profileId: pid, id: pid, shopName: shopName || '' };
}

/** 从接口响应同步 profile 上下文到全局与本地缓存 */
function syncBoundProfile(app, payload) {
  const a = app || getApp();
  const profileId = pickProfileId(payload);
  const shopName = pickShopName(payload);
  if (profileId == null) return { profileId: null, shopName: shopName || '' };
    if (a && a.globalData && a.globalData.user) {
    a.globalData.user.profile_id = profileId;
    a.globalData.user.profileId = profileId;
    a.globalData.user.sp_profile_id = profileId;
    a.globalData.user.service_provider_profile_id = profileId;
    const uid = payload.user_id != null ? payload.user_id : payload.userId;
    if (uid != null && uid !== '') {
      a.globalData.user.sp_user_id = String(uid);
    }
    if (shopName) {
      a.globalData.user.sp_shop_name = shopName;
    }
  }
  try {
    wx.setStorageSync(STORAGE_KEYS.profileId, profileId);
    if (shopName) wx.setStorageSync(STORAGE_KEYS.shopName, shopName);
  } catch (e) {}
  return { profileId, shopName: shopName || '' };
}

/** 标准化接口返回的 profile 对象 */
function normalizeProfilePayload(res) {
  if (!res || typeof res !== 'object') return {};
  if (res.profile && typeof res.profile === 'object') return res.profile;
  if (res.data && typeof res.data === 'object') {
    if (res.data.profile && typeof res.data.profile === 'object') return res.data.profile;
    return res.data;
  }
  return res;
}

module.exports = {
  getBoundProfile,
  syncBoundProfile,
  normalizeProfilePayload
};
