/**
 * 直约技工 / 直约服务商 / 发帖 / 帮帮：按小区拉取与解析
 */
const util = require('./util.js');
const { unwrapList, imgUrl } = util;

const STORAGE_PORTAL_LOC_COMMUNITY = 'portal_location_community_id';
const STORAGE_PORTAL_LOC_TEXT = 'portal_last_location_text';

/** 运营站点关键词兜底（库未部署 geofence 时） */
const LOCATION_TO_COMMUNITY_FALLBACK = [
  { id: 1, keywords: ['合川路', '合川路地铁站', '合川(地铁站)', '闵行区合川路', '阳光小区'] },
  { id: 2, keywords: ['新华之星', '新华之星AI大厦', '春风社区'] }
];

function parseKeywordsFromAreas(areas) {
  const out = [];
  (areas || []).forEach((a) => {
    const keys = [a.center_name, a.community_name, ...(a.keywords || [])].filter(Boolean);
    keys.forEach((k) => {
      if (!out.some((x) => x.id === a.community_id && x.keyword === k)) {
        out.push({ id: a.community_id, keyword: k });
      }
    });
  });
  return out;
}

/** 从选点名称、地址、标签解析小区 ID（本地关键词） */
function resolveCommunityIdFromLocation(loc, keywordRows) {
  if (!loc || typeof loc !== 'object') return null;
  const text = [loc.name, loc.address, loc.label].filter((s) => s != null && s !== '').join(' ');
  if (!text) return null;
  const rows = keywordRows && keywordRows.length
    ? keywordRows
    : LOCATION_TO_COMMUNITY_FALLBACK.flatMap((row) =>
      (row.keywords || []).map((k) => ({ id: row.id, keyword: k }))
    );
  let best = null;
  for (const item of rows) {
    if (text.indexOf(item.keyword) >= 0) {
      if (!best || item.keyword.length > best.keyword.length) best = item;
    }
  }
  return best ? best.id : null;
}

function isManualLocationPick() {
  try {
    return !!wx.getStorageSync('market_user_location_manual');
  } catch (e) {
    return false;
  }
}

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

function setPortalCommunityFromLocation(communityId) {
  const n = Number(communityId);
  if (!Number.isFinite(n) || n <= 0) return;
  try {
    wx.setStorageSync(STORAGE_PORTAL_LOC_COMMUNITY, n);
  } catch (e) {
    /* ignore */
  }
}

function clearPortalCommunityFromLocation() {
  try {
    wx.setStorageSync(STORAGE_PORTAL_LOC_COMMUNITY, 0);
  } catch (e) {
    /* ignore */
  }
}

/** 用户资料 / 我的页绑定的小区 ID */
function getBoundCommunityId(app) {
  const g = (app && app.globalData) || {};
  const u = g.user || {};
  const raw =
    u.communityId ??
    u.community_id ??
    g.communityId ??
    g.community_id ??
    null;
  if (raw != null && raw !== '') {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  try {
    const cached = wx.getStorageSync('user_community_id');
    const n = Number(cached);
    if (Number.isFinite(n) && n > 0) return n;
  } catch (e) {
    /* ignore */
  }
  return null;
}

/**
 * 直约/帮帮/热卖用的小区 ID
 * 1. 地图主动选点：geofence/关键词解析（不回退绑定，避免人在外地仍看合川路）
 * 2. 未选点：我的页绑定小区为默认
 * 3. 兜底：上次选点缓存 portal_location_community_id
 */
function getActiveCommunityId(app) {
  if (!isManualLocationPick()) {
    try {
      const activeId = Number(wx.getStorageSync('active_community_id'));
      if (Number.isFinite(activeId) && activeId > 0) return activeId;
    } catch (e) {
      /* ignore */
    }
  }

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

  const bound = getBoundCommunityId(app);
  if (bound != null) return bound;

  try {
    const locCid = Number(wx.getStorageSync(STORAGE_PORTAL_LOC_COMMUNITY));
    if (Number.isFinite(locCid) && locCid > 0) return locCid;
  } catch (e) {
    /* ignore */
  }

  return null;
}

/**
 * 服务端 geofence 解析（坐标优先，其次文案）
 * @returns {Promise<number|null>}
 */
async function resolveCommunityIdRemote(loc) {
  if (!loc || typeof loc !== 'object') return null;
  try {
    const body = {
      latitude: loc.latitude != null ? loc.latitude : loc.lat,
      longitude: loc.longitude != null ? loc.longitude : loc.lng,
      name: loc.name,
      address: loc.address,
      label: loc.label
    };
    const res = await util.post('core/communities/resolve', body);
    if (res && res.matched && res.community_id != null) {
      return Number(res.community_id);
    }
  } catch (e) {
    /* 未部署时走本地关键词 */
  }
  return resolveCommunityIdFromLocation(loc);
}

/**
 * 根据选点更新直约小区
 * @returns {Promise<boolean>}
 */
async function applyPortalCommunityFromLocation(loc, options) {
  const manual = (options && options.manual) || isManualLocationPick();
  savePortalLocationText(loc);
  const cid = await resolveCommunityIdRemote(loc);
  if (cid != null) {
    setPortalCommunityFromLocation(cid);
    return true;
  }
  if (manual) clearPortalCommunityFromLocation();
  return false;
}

/** 发布帮帮/一键发布前：确保有小区（绑定或选点） */
function ensureCommunityForPublish(app) {
  const cid = getActiveCommunityId(app);
  if (cid != null) return Promise.resolve(cid);
  return new Promise((resolve, reject) => {
    wx.showModal({
      title: '需要绑定小区',
      content: '请先在「我的」绑定所属小区，或在首页地图选点进入服务范围后再发布。',
      confirmText: '去绑定',
      cancelText: '取消',
      success(r) {
        if (r.confirm) {
          wx.navigateTo({ url: '/pages/bind-community/bind-community' });
        }
        reject(new Error('未绑定小区'));
      },
      fail: () => reject(new Error('未绑定小区'))
    });
  });
}

function workerCommunityQuery(communityId, extra = {}) {
  if (communityId == null) return { ...extra };
  return { community_id: communityId, ...extra };
}

async function fetchWorkerRows(communityId, opts = {}) {
  if (communityId == null) return [];
  const params = workerCommunityQuery(communityId, {
    page: opts.page != null ? opts.page : 1,
    limit: opts.limit != null ? opts.limit : 50
  });
  const res = await util.get('core/workers', params);
  let list = unwrapList(res);
  try {
    const hd = await util.get('home-display/items', { kind: 'worker', community_id: communityId });
    const hdList = unwrapList(hd && hd.list ? { list: hd.list } : hd);
    if (hdList.length > 0) {
      const seen = new Set(list.map((w) => String(w.id != null ? w.id : w.user_id)));
      const extra = [];
      for (const item of hdList) {
        const uid = item.target_id != null ? item.target_id : item.targetId;
        if (uid == null || seen.has(String(uid))) continue;
        seen.add(String(uid));
        extra.push({
          id: uid,
          name: item.title || '技工',
          real_name: item.title || '技工',
          avatar_url: item.cover || '',
          industry: item.description || '',
          service_count: 0
        });
      }
      if (extra.length) list = extra.concat(list);
    }
  } catch (e) {
    /* home-display 未部署时仅用 core/workers */
  }
  return list;
}

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

function getPostCommunityId(app) {
  return getActiveCommunityId(app);
}

module.exports = {
  LOCATION_TO_COMMUNITY_FALLBACK,
  resolveCommunityIdFromLocation,
  resolveCommunityIdRemote,
  isManualLocationPick,
  savePortalLocationText,
  setPortalCommunityFromLocation,
  clearPortalCommunityFromLocation,
  getBoundCommunityId,
  applyPortalCommunityFromLocation,
  getActiveCommunityId,
  getPostCommunityId,
  ensureCommunityForPublish,
  workerCommunityQuery,
  fetchWorkerRows,
  fetchServiceProviderRows,
  mapServiceProviderForHomeCard
};
