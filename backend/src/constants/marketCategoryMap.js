'use strict';

// 首页/入驻 10 个大类：中文展示名 <-> 稳定编码（用于 DB 存储/查询）
const MARKET_CATEGORY_MAPPINGS = [
  { code: 'AAAA', name: '食品生鲜' },
  { code: 'AAAB', name: '美妆洗护' },
  { code: 'AAAC', name: '居家百货' },
  { code: 'AAAD', name: '服装箱包' },
  { code: 'AAAE', name: '母婴系列' },
  { code: 'AAAF', name: '家用电器' },
  { code: 'AAAG', name: '数码产品' },
  { code: 'AAAH', name: '珠宝饰品' },
  { code: 'AAAI', name: '旅游出行' },
  { code: 'AAAJ', name: '传统工艺' }
];

const CATEGORY_NAME_TO_CODE = Object.fromEntries(
  MARKET_CATEGORY_MAPPINGS.map((item) => [item.name, item.code])
);

const CATEGORY_CODE_TO_NAME = Object.fromEntries(
  MARKET_CATEGORY_MAPPINGS.map((item) => [item.code, item.name])
);

function normalizeShopCategory(input) {
  const raw = String(input == null ? '' : input).trim();
  if (!raw) return '';
  if (CATEGORY_NAME_TO_CODE[raw]) return CATEGORY_NAME_TO_CODE[raw];
  return raw;
}

/** 列表筛选：同时匹配稳定编码与中文名（兼容历史脏数据） */
function categoryWhereValues(input) {
  const code = normalizeShopCategory(input);
  if (!code) return [];
  const set = new Set([code]);
  if (CATEGORY_CODE_TO_NAME[code]) set.add(CATEGORY_CODE_TO_NAME[code]);
  const raw = String(input == null ? '' : input).trim();
  if (raw && raw !== code) set.add(raw);
  return [...set];
}

/** 审核建店时无坐标则使用默认点（合川路联调区，可用环境变量覆盖） */
function resolveShopCoordinates(fields = {}) {
  const lat = fields.latitude ?? fields.lat;
  const lng = fields.longitude ?? fields.lng;
  const latN = Number(lat);
  const lngN = Number(lng);
  if (Number.isFinite(latN) && Number.isFinite(lngN)) {
    return { latitude: latN, longitude: lngN };
  }
  return {
    latitude: Number(process.env.MARKET_DEFAULT_LAT || 31.166564),
    longitude: Number(process.env.MARKET_DEFAULT_LNG || 121.384776)
  };
}

module.exports = {
  MARKET_CATEGORY_MAPPINGS,
  CATEGORY_NAME_TO_CODE,
  CATEGORY_CODE_TO_NAME,
  normalizeShopCategory,
  categoryWhereValues,
  resolveShopCoordinates
};
