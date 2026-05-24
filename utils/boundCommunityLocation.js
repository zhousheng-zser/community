/**
 * 本地商城 / 本地集市 / 推品列表：仅使用「已选用/绑定」小区主数据坐标查询
 * 未绑定或小区无经纬度 → 调用方展示空列表
 */
const config = require('./config.js');
const { findCommunityById } = require('./communitySearch.js');

function communityBind() {
  return require('./communityBind.js');
}

/**
 * @returns {Promise<{ communityId: number, lat: number, lng: number, name: string } | null>}
 */
async function resolveBoundCommunityCoords() {
  const id = communityBind().getStoredActiveId();
  if (!id) return null;
  try {
    const hit = await findCommunityById(id);
    if (!hit) return null;
    const lat = Number(hit.latitude);
    const lng = Number(hit.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      communityId: id,
      lat,
      lng,
      name: hit.name || ''
    };
  } catch (e) {
    return null;
  }
}

function buildShopGoodsQueryFromCoords(coords, extra = {}) {
  const q = { ...extra };
  q.user_lat = coords.lat;
  q.user_lng = coords.lng;
  q.community_id = coords.communityId;
  q.distance_km =
    q.distance_km != null
      ? q.distance_km
      : config.marketShopRadiusKm != null
        ? config.marketShopRadiusKm
        : 10;
  return q;
}

function buildMarketShopsQueryFromCoords(coords, extra = {}, activeMarketSort = 'distance') {
  const q = { ...extra };
  if (!q.page) q.page = 1;
  if (!q.page_size) q.page_size = 30;
  q.user_lat = coords.lat;
  q.user_lng = coords.lng;
  q.community_id = coords.communityId;
  q.radius_km =
    q.radius_km != null
      ? q.radius_km
      : config.marketShopRadiusKm != null
        ? config.marketShopRadiusKm
        : 10;
  const sortMode = activeMarketSort || 'distance';
  q.sort = sortMode === 'comprehensive' ? 'comprehensive' : 'distance';
  return q;
}

/** 本地商城 modules 无绑定时的空数据结构 */
function emptyLocalGoodsModulesResult() {
  return {
    pushDailyNews: [],
    pushTopSales: [],
    pushPeriodicTabs: [],
    pushPeriodicGoodsDict: {},
    pushPeriodicGoods: [],
    activePeriodicTabIndex: 0,
    pushFeedTabs: [],
    pushFeedGoodsDict: {},
    pushFeedGoods: [],
    activeFeedTab: '',
    feedPageByTab: {},
    feedHasMoreByTab: {}
  };
}

module.exports = {
  resolveBoundCommunityCoords,
  buildShopGoodsQueryFromCoords,
  buildMarketShopsQueryFromCoords,
  emptyLocalGoodsModulesResult
};
