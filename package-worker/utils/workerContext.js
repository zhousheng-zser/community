/**
 * 技工端：解析并缓存当前绑定的技工 profile
 */
const STORAGE_KEYS = {
  profileId: 'worker_bound_profile_id',
  realName: 'worker_bound_real_name',
  industry: 'worker_bound_industry'
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
    payload.worker_profile_id != null ? payload.worker_profile_id
      : payload.workerProfileId != null ? payload.workerProfileId
        : payload.profile_id != null ? payload.profile_id
          : payload.profileId != null ? payload.profileId
            : payload.id != null ? payload.id
              : null
  );
}

function pickRealName(payload) {
  if (!payload || typeof payload !== 'object') return '';
  return String(
    payload.real_name || payload.realName || payload.name || ''
  ).trim();
}

function pickIndustry(payload) {
  if (!payload || typeof payload !== 'object') return '';
  return String(
    payload.industry || payload.skill || payload.main_direction || payload.mainDirection || ''
  ).trim();
}

function getBoundProfile(app) {
  const a = app || getApp();
  const u = (a && a.globalData && a.globalData.user) || {};
  const profileId = pickProfileId(u);
  let realName = pickRealName(u);
  let industry = pickIndustry(u);
  if (!realName) realName = String(u.worker_real_name || '').trim();
  if (!industry) industry = String(u.worker_industry || '').trim();
  if (!realName) realName = String(wx.getStorageSync(STORAGE_KEYS.realName) || '').trim();
  if (!industry) industry = String(wx.getStorageSync(STORAGE_KEYS.industry) || '').trim();

  if (profileId == null) {
    try {
      const cacheId = toProfileId(wx.getStorageSync(STORAGE_KEYS.profileId));
      if (cacheId != null) {
        return {
          profileId: cacheId,
          id: cacheId,
          realName: realName || String(wx.getStorageSync(STORAGE_KEYS.realName) || '').trim(),
          industry: industry || String(wx.getStorageSync(STORAGE_KEYS.industry) || '').trim()
        };
      }
    } catch (e) {}
    return { profileId: null, id: null, realName, industry };
  }

  return { profileId, id: profileId, realName, industry };
}

function syncBoundProfile(app, payload) {
  const a = app || getApp();
  const profileId = pickProfileId(payload);
  const realName = pickRealName(payload);
  const industry = pickIndustry(payload);
  if (profileId == null && !realName && !industry) {
    return getBoundProfile(a);
  }

  if (a && a.globalData && a.globalData.user) {
    if (profileId != null) {
      a.globalData.user.worker_profile_id = profileId;
      a.globalData.user.workerProfileId = profileId;
    }
    if (realName) a.globalData.user.worker_real_name = realName;
    if (industry) a.globalData.user.worker_industry = industry;
  }

  try {
    if (profileId != null) wx.setStorageSync(STORAGE_KEYS.profileId, profileId);
    if (realName) wx.setStorageSync(STORAGE_KEYS.realName, realName);
    if (industry) wx.setStorageSync(STORAGE_KEYS.industry, industry);
  } catch (e) {}

  return {
    profileId: profileId != null ? profileId : pickProfileId((a && a.globalData && a.globalData.user) || {}),
    id: profileId,
    realName,
    industry
  };
}

function normalizeApplicationPayload(res) {
  if (!res || typeof res !== 'object') return {};
  if (res.data && typeof res.data === 'object') return res.data;
  return res;
}

function normalizeWorkerDetailPayload(res) {
  if (!res || typeof res !== 'object') return {};
  if (res.data && typeof res.data === 'object') return res.data;
  return res;
}

module.exports = {
  getBoundProfile,
  syncBoundProfile,
  normalizeApplicationPayload,
  normalizeWorkerDetailPayload
};
