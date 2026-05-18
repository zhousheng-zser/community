/**
 * 将 GET /core/service-home-modules 的 modules 转为首页 categoryList 行（icon 仍为相对路径，由页面侧 imgUrl 映射）
 */

/** 中台未配图时回退到小程序包内九宫格图标（与 pages/index 本地兜底一致） */
const HOME_CATEGORY_ICON_BY_KEY = {
  tidy: '/img/home_categories/tidy.png',
  urgent_fix: '/img/home_categories/urgent_fix.png',
  appliance_clean: '/img/home_categories/appliance_clean.png',
  pioneer_clean: '/img/home_categories/pioneer_clean.png',
  mite_remove: '/img/home_categories/mite_remove.png',
  furniture_care: '/img/home_categories/furniture_care.png',
  baby_home: '/img/home_categories/baby_home.png',
  house_repair: '/img/home_categories/house_repair.png',
  beauty_home: '/img/home_categories/beauty_home.png'
};

const HOME_CATEGORY_META_BY_KEY = {
  tidy: { emoji: '🗂', bgColor: '#fff4eb' },
  urgent_fix: { emoji: '🔧', bgColor: '#fff0e6' },
  appliance_clean: { emoji: '🫧', bgColor: '#fff7ed' },
  pioneer_clean: { emoji: '🧹', bgColor: '#ffedd5' },
  mite_remove: { emoji: '🌿', bgColor: '#fff5eb' },
  furniture_care: { emoji: '🪑', bgColor: '#ffeee6' },
  baby_home: { emoji: '👶', bgColor: '#fff8f0' },
  house_repair: { emoji: '🏠', bgColor: '#ffe8dc' },
  beauty_home: { emoji: '💄', bgColor: '#ffeadf' }
};

function sortModulesStable(list) {
  return [...list].sort((a, b) => {
    const sa = Number(a.sort);
    const sb = Number(b.sort);
    const aOk = !Number.isNaN(sa);
    const bOk = !Number.isNaN(sb);
    if (aOk && bOk && sa !== sb) return sa - sb;
    if (aOk && !bOk) return -1;
    if (!aOk && bOk) return 1;
    return 0;
  });
}

/** 兼容 JSON 文件与中台 DB 两种字段：name/title、icon/icon_url、sort/sort_order */
function normalizeHomeModuleRow(m) {
  if (!m || typeof m !== 'object') return null;
  const groupKey = String(m.group_key || m.groupKey || '').trim();
  const name = (m.name != null ? String(m.name) : m.title != null ? String(m.title) : '').trim();
  if (!groupKey || !name) return null;
  const sortVal = m.sort != null ? m.sort : m.sort_order;
  let icon = (m.icon != null && String(m.icon).trim()) || (m.icon_url != null && String(m.icon_url).trim()) || '';
  if (!icon) icon = HOME_CATEGORY_ICON_BY_KEY[groupKey] || '';
  const meta = HOME_CATEGORY_META_BY_KEY[groupKey] || {};
  const rawUrl = m.url != null ? String(m.url).trim() : '';
  const url =
    rawUrl ||
    `../tidy-service/tidy-service?key=${encodeURIComponent(groupKey)}`;
  return {
    groupKey,
    name,
    sort: sortVal,
    icon,
    emoji: (m.emoji != null && String(m.emoji)) || meta.emoji || '📌',
    bgColor:
      (m.bg_color != null && String(m.bg_color).trim()) ||
      (m.bgColor != null && String(m.bgColor).trim()) ||
      meta.bgColor ||
      '#fff5eb',
    url
  };
}

/** 排除非到家类误配模块（如 shop）；中台新建的 group_key 应正常展示 */
const HOME_SERVICE_GROUP_BLOCKLIST = new Set(['shop', 'market', 'merchant']);

function mapRawModulesToCategoryRows(modules) {
  if (!Array.isArray(modules) || modules.length === 0) return [];
  return sortModulesStable(modules)
    .map(normalizeHomeModuleRow)
    .filter((row) => row && !HOME_SERVICE_GROUP_BLOCKLIST.has(row.groupKey));
}

module.exports = {
  mapRawModulesToCategoryRows,
  HOME_CATEGORY_ICON_BY_KEY,
  HOME_SERVICE_GROUP_BLOCKLIST
};
