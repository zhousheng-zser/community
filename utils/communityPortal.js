/**
 * 直约技工 / 直约服务商：按小区拉取列表（首页与「查看全部」共用）
 */
const util = require('./util.js');
const { unwrapList, imgUrl } = util;

/**
 * 地图选点/地址文案 → community_id（运营站点，可扩展）
 * id 须与 worker_profiles / service_provider_profiles.community_id 一致
 */
const LOCATION_TO_COMMUNITY = [
  { id: 1, keywords: ['合川路', '合川路地铁站', '合川(地铁站)', '闵行区合川路'] }
];

/** 从选点名称、地址、标签解析小区 ID */
function resolveCommunityIdFromLocation(loc) {
  if (!loc || typeof loc !== 'object') return null;
  const text = [loc.name, loc.address, loc.label].filter((s) => s != null && s !== '').join(' ');
  if (!text) return null;
  for (const row of LOCATION_TO_COMMUNITY) {
    if ((row.keywords || []).some((k) => text.indexOf(k) >= 0)) return row.id;
  }
  return null;
}

const STORAGE_PORTAL_LOC_COMMUNITY = 'portal_location_community_id';
const STORAGE_PORTAL_LOC_TEXT = 'portal_last_location_text';

/** 用户是否在首页地图主动选过点 */
function isManualLocationPick() {
  try {
    return !!wx.getStorageSync('market_user_location_manual');
  } catch (e) {
    return false;
  }
}

/** 记录最近一次选点文案，便于 onShow 恢复直约小区判断 */
function savePortalLocationText(loc) {
  const text = [loc && loc.name, loc && loc.address, loc && loc.label]
    .filter((s) => s != null && s !== '')
    .join(' ');
  try {
    if (text) wx.setStorageSync(STORAGE_PORTAL_LOC_TEXT, text);
    else wx.removeStorageSync(STORAGE_PORTAL_LOC_TEXT);
  } catch (e) {
    /* ignore */
  }
}

/** 直约模块：定位匹配到运营站点时写入 */
function setPortalCommunityFromLocation(communityId) {
  const n = Number(communityId);
  if (!Number.isFinite(n) || n <= 0) return;
  try {
    wx.setStorageSync(STORAGE_PORTAL_LOC_COMMUNITY, n);
  } catch (e) {
    /* ignore */
  }
}

/** 直约模块：当前选点不在任何运营站点服务范围 */
function clearPortalCommunityFromLocation() {
  try {
    wx.setStorageSync(STORAGE_PORTAL_LOC_COMMUNITY, 0);
  } catch (e) {
    /* ignore */
  }
}

/**
 * 直约技工/服务商用的小区 ID。
 * 若用户地图主动选点：仅以选点解析结果为准，不回退登录资料（避免人在成都仍看到合川路）。
 * 未主动选点时：用用户资料 / 缓存中的 community_id。
 */
function getActiveCommunityId(app) {
  if (isManualLocationPick()) {
    let locCid;
    try {
      locCid = wx.getStorageSync(STORAGE_PORTAL_LOC_COMMUNITY);
    } catch (e) {
      locCid = null;
    }
    if (locCid === 0 || locCid === '0') return null;
    const n = Number(locCid);
    if (Number.isFinite(n) && n > 0) return n;
    let text = '';
    try {
      text = wx.getStorageSync(STORAGE_PORTAL_LOC_TEXT) || wx.getStorageSync('market_location_label') || '';
    } catch (e) {
      text = '';
    }
    if (text) {
      const resolved = resolveCommunityIdFromLocation({ name: text, label: text });
      if (resolved != null) {
        setPortalCommunityFromLocation(resolved);
        return resolved;
      }
    }
    return null;
  }

  const g = (app && app.globalData) || {};
  const u = g.user || {};
  const raw =
    u.communityId ??
    u.community_id ??
    g.communityId ??
    g.community_id ??
    wx.getStorageSync('community_id') ??
    wx.getStorageSync('communityId') ??
    null;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * 根据选点更新直约小区；manual 时未匹配则清空直约列表（不沿用账号绑定小区）
 * @returns {boolean} 是否匹配到运营站点
 */
function applyPortalCommunityFromLocation(loc, options) {
  const manual = (options && options.manual) || isManualLocationPick();
  savePortalLocationText(loc);
  const cid = resolveCommunityIdFromLocation(loc);
  if (cid != null) {
    setPortalCommunityFromLocation(cid);
    return true;
  }
  if (manual) clearPortalCommunityFromLocation();
  return false;
}

/** 技工/服务商 API 共用的小区 query（未绑定小区时返回 null） */
function workerCommunityQuery(communityId, extra = {}) {
  if (communityId == null) return { ...extra };
  return { community_id: communityId, ...extra };
}

/** GET /core/workers — 仅按小区，无全量/假数据回退 */
async function fetchWorkerRows(communityId, opts = {}) {
  if (communityId == null) return [];
  const params = workerCommunityQuery(communityId, {
    page: opts.page != null ? opts.page : 1,
    limit: opts.limit != null ? opts.limit : 50
  });
  const res = await util.get('core/workers', params);
  return unwrapList(res);
}

/** GET /core/service-providers — 仅按小区 */
async function fetchServiceProviderRows(communityId, opts = {}) {
  if (communityId == null) return [];
  const params = workerCommunityQuery(communityId, {
    limit: opts.limit != null ? opts.limit : 30
  });
  const res = await util.get('core/service-providers', params);
  return unwrapList(res);
}

function mapServiceProviderForHomeCard(p, imgUrlFn) {
  const pid = p.profile_id != null ? p.profile_id : (p.id != null ? p.id : p.provider_id);
  const pidStr = pid != null ? String(pid) : '';
  const cover = p.cover_image || p.shop_front_url || p.avatar_url || p.avatar || '';
  const toImg = imgUrlFn || imgUrl;
  return {
    id: pidStr,
    idStr: pidStr,
    name: p.name || p.shop_name || p.display_name || '服务商',
    sub: p.subtitle || p.tagline || (p.service_count != null ? `服务${p.service_count}单` : '直约到家'),
    image: cover ? toImg(cover) : '',
    url: `../service-provider-shop/service-provider-shop?provider_id=${encodeURIComponent(pidStr)}`
  };
}

module.exports = {
  LOCATION_TO_COMMUNITY,
  resolveCommunityIdFromLocation,
  isManualLocationPick,
  savePortalLocationText,
  setPortalCommunityFromLocation,
  clearPortalCommunityFromLocation,
  applyPortalCommunityFromLocation,
  getActiveCommunityId,
  workerCommunityQuery,
  fetchWorkerRows,
  fetchServiceProviderRows,
  mapServiceProviderForHomeCard
};
