/**
 * 首页九宫格 / 生活服务专区 — 与「九州中台」约定的 JSON 结构（可被 core.controller 与文档引用）
 *
 * module 字段：
 * - group_key (string, 必填)：路由参数 key，如 tidy；建议英文 slug，与小程序 tidy-service 本地兜底 key 一致时可复用本地服务清单
 * - name (string, 必填)：展示名称
 * - icon (string, 可选)：图标 URL 或小程序内路径，如 /img/home_categories/tidy.png
 * - emoji (string, 可选)：无 icon 时展示
 * - bg_color (string, 可选)：无 icon 时背景色，如 #fff4eb
 * - sort (number, 可选)：升序，缺省按数组顺序
 * - url (string, 可选)：点击跳转路径；缺省为 ../tidy-service/tidy-service?key=<group_key>
 * - categories (string[], 可选)：专区页左侧类目；缺省由 services 推导并带「热门服务」
 * - price_unit (string, 可选)：份/次 等，缺省「次」
 * - services (object[], 可选)：有则专区页用中台数据；每项字段：
 *    - id (number|string, 可选)
 *    - category (string, 必填)：所属类目标签，用于筛选
 *    - title (string, 必填)
 *    - price (string, 必填)：展示用，如 196元/份
 *    - description (string, 可选)
 *    - image_url (string, 可选)：完整 URL 或 /uploads/... 相对路径（小程序侧会走 imgUrl）
 */

const path = require('path');
const fs = require('fs');

/** 与小程序 pages/index 原九类一致，供文件缺失时内置默认 */
const DEFAULT_MODULES = [
  { group_key: 'tidy', name: '整理收纳', icon: '/img/home_categories/tidy.png', emoji: '🗂', bg_color: '#fff4eb', sort: 1 },
  { group_key: 'urgent_fix', name: '家修急事', icon: '/img/home_categories/urgent_fix.png', emoji: '🔧', bg_color: '#fff0e6', sort: 2 },
  { group_key: 'appliance_clean', name: '家电清洗', icon: '/img/home_categories/appliance_clean.png', emoji: '🫧', bg_color: '#fff7ed', sort: 3 },
  { group_key: 'pioneer_clean', name: '开荒保洁', icon: '/img/home_categories/pioneer_clean.png', emoji: '🧹', bg_color: '#ffedd5', sort: 4 },
  { group_key: 'mite_remove', name: '除螨服务', icon: '/img/home_categories/mite_remove.png', emoji: '🌿', bg_color: '#fff5eb', sort: 5 },
  { group_key: 'furniture_care', name: '家具养护', icon: '/img/home_categories/furniture_care.png', emoji: '🪑', bg_color: '#ffeee6', sort: 6 },
  { group_key: 'baby_home', name: '宝宝家事', icon: '/img/home_categories/baby_home.png', emoji: '👶', bg_color: '#fff8f0', sort: 7 },
  { group_key: 'house_repair', name: '房屋修缮', icon: '/img/home_categories/house_repair.png', emoji: '🏠', bg_color: '#ffe8dc', sort: 8 },
  { group_key: 'beauty_home', name: '上门美业', icon: '/img/home_categories/beauty_home.png', emoji: '💄', bg_color: '#ffeadf', sort: 9 }
];

function resolveDataFilePath() {
  if (process.env.HOME_MODULES_JSON_PATH) {
    const p = String(process.env.HOME_MODULES_JSON_PATH).trim();
    if (p && fs.existsSync(p)) return p;
  }
  const fromBackendRoot = path.join(__dirname, '../../../../data/home-service-modules.json');
  if (fs.existsSync(fromBackendRoot)) return fromBackendRoot;
  return null;
}

function loadModulesPayload() {
  const fp = resolveDataFilePath();
  if (!fp) {
    return { version: 1, modules: DEFAULT_MODULES.map((m) => ({ ...m })) };
  }
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch (e) {
    console.error('[home-modules] JSON 解析失败，使用内置默认', fp, e.message);
    return { version: 1, modules: DEFAULT_MODULES.map((m) => ({ ...m })) };
  }
  const modules = Array.isArray(raw.modules) ? raw.modules : Array.isArray(raw) ? raw : [];
  return {
    version: raw.version != null ? raw.version : 1,
    updated_at: raw.updated_at || null,
    modules: modules.length ? modules : DEFAULT_MODULES.map((m) => ({ ...m }))
  };
}

module.exports = {
  DEFAULT_MODULES,
  loadModulesPayload,
  resolveDataFilePath
};
