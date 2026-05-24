/**
 * 小区列表搜索 — 对接 GET /core/communities（见 doc/后端接口文档-小区绑定与搜索.md）
 */
const geo = require('./geo.js');
const api = require('../api/index.js');
const { withTimeout } = require('./asyncTimeout.js');

const DEFAULT_CITIES = ['上海市', '北京市', '成都市', '杭州市', '广州市', '深圳市'];

/** 切换城市时地图默认中心（GCJ-02） */
const CITY_MAP_CENTERS = {
  上海: { latitude: 31.2304, longitude: 121.4737 },
  北京: { latitude: 39.9042, longitude: 116.4074 },
  成都: { latitude: 30.5728, longitude: 104.0668 },
  杭州: { latitude: 30.2741, longitude: 120.1551 },
  广州: { latitude: 23.1291, longitude: 113.2644 },
  深圳: { latitude: 22.5431, longitude: 114.0579 }
};

/** 请求参数：后端 city 为模糊匹配，示例「上海」 */
function formatCityQuery(city) {
  if (!city) return '';
  return String(city).replace(/市$/, '').trim();
}

function formatCityDisplay(city) {
  if (!city) return '';
  const s = String(city).trim();
  if (!s) return '';
  return s.endsWith('市') ? s : `${s}市`;
}

function normalizeCommunityRow(row) {
  if (!row || row.id == null) return null;
  const address = row.address || '';
  const region = geo.parseRegionFromAddress(address);
  const city = row.city || region.city || '';
  const district = row.district || region.district || '';
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);
  const cityDisplay = formatCityDisplay(city) || city;
  return {
    id: Number(row.id),
    name: row.name || '',
    address,
    city: cityDisplay || city,
    district,
    regionPath: [cityDisplay || city, district].filter(Boolean).join('/') || address,
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lng) ? lng : null,
    radius_meters: row.radius_meters != null ? Number(row.radius_meters) : null,
    distance: row.distance != null ? Number(row.distance) : null
  };
}

function unwrapCommunityList(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.list)) return res.list;
  if (res && res.data && Array.isArray(res.data.list)) return res.data.list;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

function unwrapCommunityTotal(res, listLength) {
  if (res && res.total != null) return Number(res.total);
  if (res && res.data && res.data.total != null) return Number(res.data.total);
  return listLength;
}

function cityMatchKeys(city) {
  const q = formatCityQuery(city);
  if (!q) return [];
  const keys = [q];
  if (q.length >= 2) keys.push(`${q}市`);
  return keys;
}

/** 按所选城市过滤（后端未筛或返回全量时的兜底） */
function filterCommunitiesByCity(list, city) {
  const keys = cityMatchKeys(city);
  if (!keys.length) return list || [];
  return (list || []).filter((row) => {
    const text = [row.city, row.district, row.address, row.regionPath]
      .filter(Boolean)
      .join('|');
    return keys.some((k) => text.indexOf(k) >= 0);
  });
}

function getCityMapCenter(city) {
  const q = formatCityQuery(city);
  if (q && CITY_MAP_CENTERS[q]) return CITY_MAP_CENTERS[q];
  return CITY_MAP_CENTERS['上海'];
}

/**
 * @param {{ city?: string, keyword?: string, page?: number, page_size?: number, latitude?: number, longitude?: number }} params
 */
async function searchCommunities(params) {
  const {
    city,
    keyword,
    page = 1,
    page_size = 100,
    latitude,
    longitude
  } = params || {};

  const query = { page, page_size };
  const cityQ = formatCityQuery(city);
  if (cityQ) query.city = cityQ;
  if (keyword && String(keyword).trim()) query.keyword = String(keyword).trim();
  if (latitude != null && longitude != null) {
    query.latitude = latitude;
    query.longitude = longitude;
  }

  const res = await api.core.getCommunities(query);
  const raw = unwrapCommunityList(res);
  let list = raw.map(normalizeCommunityRow).filter(Boolean);
  if (cityQ) {
    list = filterCommunitiesByCity(list, city);
  }
  const total = list.length;
  return { list, total, page, page_size };
}

function collectCitiesFromList(list) {
  const set = new Set(DEFAULT_CITIES);
  (list || []).forEach((r) => {
    const row = normalizeCommunityRow(r);
    if (row && row.city) set.add(row.city);
  });
  return Array.from(set);
}

let _catalogCache = null;
let _catalogCacheAt = 0;
let _catalogInflight = null;
const CATALOG_CACHE_MS = 60 * 1000;

/** 拉取小区主数据（用于校验 community_id、补全名称） */
async function fetchCommunitiesCatalog() {
  const now = Date.now();
  if (_catalogCache && now - _catalogCacheAt < CATALOG_CACHE_MS) {
    return _catalogCache;
  }
  if (_catalogInflight) return _catalogInflight;

  _catalogInflight = (async () => {
    try {
      const res = await withTimeout(
        api.core.getCommunities({ page: 1, page_size: 100 }),
        12000,
        '小区列表'
      );
      const raw = unwrapCommunityList(res);
      _catalogCache = raw.map(normalizeCommunityRow).filter(Boolean);
      _catalogCacheAt = Date.now();
      return _catalogCache;
    } catch (e) {
      if (_catalogCache) return _catalogCache;
      return [];
    } finally {
      _catalogInflight = null;
    }
  })();

  return _catalogInflight;
}

async function findCommunityById(communityId) {
  const id = Number(communityId);
  if (!Number.isFinite(id) || id <= 0) return null;
  const list = await fetchCommunitiesCatalog();
  return list.find((c) => Number(c.id) === id) || null;
}

function isPlaceholderCommunityName(name) {
  return /^小区#\d+$/.test(String(name || '').trim());
}

module.exports = {
  DEFAULT_CITIES,
  CITY_MAP_CENTERS,
  formatCityQuery,
  formatCityDisplay,
  normalizeCommunityRow,
  filterCommunitiesByCity,
  getCityMapCenter,
  searchCommunities,
  collectCitiesFromList,
  unwrapCommunityList,
  fetchCommunitiesCatalog,
  findCommunityById,
  isPlaceholderCommunityName
};
