'use strict';

// 首页 10 个分类：前端展示名 <-> 稳定编码（用于 DB 存储/查询）
const MARKET_CATEGORY_MAPPINGS = [
  { code: 'AAAA', name: '母婴生活馆' },
  { code: 'AAAB', name: '家庭服务' },
  { code: 'AAAC', name: '超市便利' },
  { code: 'AAAD', name: '美食外卖' },
  { code: 'AAAE', name: '看病买药' },
  { code: 'AAAF', name: '鲜花礼品' },
  { code: 'AAAG', name: '水果蔬菜' },
  { code: 'AAAH', name: '服装首饰' },
  { code: 'AAAI', name: '电子数码' },
  { code: 'AAAJ', name: '本地玩乐' }
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

module.exports = {
  MARKET_CATEGORY_MAPPINGS,
  CATEGORY_NAME_TO_CODE,
  CATEGORY_CODE_TO_NAME,
  normalizeShopCategory
};
