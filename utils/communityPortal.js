/**
 * 直约技工 / 直约服务商：按小区拉取列表（首页与「查看全部」共用）
 */
const util = require('./util.js');
const { unwrapList, imgUrl } = util;

/** 当前用户绑定的小区 ID */
function getActiveCommunityId(app) {
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
  getActiveCommunityId,
  workerCommunityQuery,
  fetchWorkerRows,
  fetchServiceProviderRows,
  mapServiceProviderForHomeCard
};
