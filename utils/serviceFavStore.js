/**
 * 服务/服务商 收藏（本地 Storage）
 *
 * 参考 browseFootprint.js，用本地 Storage 存储服务和服务商的收藏。
 * 与 favoritesStore.js（仅市场商品）独立，互不干扰。
 */
const KEY = 'user_service_favorites_v1';
const MAX = 200;

const KIND_LABELS = {
  service: '到家服务',
  service_provider: '服务商'
};

function getAll() {
  try {
    const arr = wx.getStorageSync(KEY);
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

function saveAll(arr) {
  try { wx.setStorageSync(KEY, arr); } catch (e) {}
}

/**
 * 添加收藏
 * @param {Object} opt
 * @param {string} opt.kind - 'service' | 'service_provider'
 * @param {string|number} opt.id - 服务ID或服务商ID
 * @param {string} opt.title
 * @param {string} [opt.cover]
 * @param {string} [opt.price]
 * @param {string} opt.url - 跳转路径（/ 开头）
 */
function add(opt) {
  if (!opt || !opt.kind || !opt.id || !opt.url) return;
  const dedupeKey = `${opt.kind}:${opt.id}`;
  let list = getAll().filter(x => x.dedupeKey !== dedupeKey);
  list.unshift({
    kind: opt.kind,
    id: opt.id,
    dedupeKey,
    title: String(opt.title || '').trim() || '服务',
    cover: opt.cover || '',
    price: opt.price || '',
    url: opt.url,
    t: Date.now()
  });
  list = list.slice(0, MAX);
  saveAll(list);
}

function remove(kind, id) {
  const dedupeKey = `${kind}:${id}`;
  saveAll(getAll().filter(x => x.dedupeKey !== dedupeKey));
}

function has(kind, id) {
  const dedupeKey = `${kind}:${id}`;
  return getAll().some(x => x.dedupeKey === dedupeKey);
}

function toggle(opt) {
  if (has(opt.kind, opt.id)) {
    remove(opt.kind, opt.id);
    return false;
  } else {
    add(opt);
    return true;
  }
}

function getList(kind) {
  const all = getAll();
  if (!kind) return all;
  return all.filter(x => x.kind === kind);
}

function count(kind) {
  return getList(kind).length;
}

function clear(kind) {
  if (!kind) {
    saveAll([]);
  } else {
    saveAll(getAll().filter(x => x.kind !== kind));
  }
}

function open(item) {
  if (!item || !item.url) return;
  wx.navigateTo({
    url: item.url,
    fail() { wx.switchTab({ url: '/pages/index/index' }); }
  });
}

module.exports = {
  KIND_LABELS,
  add,
  remove,
  has,
  toggle,
  getList,
  getAll,
  count,
  clear,
  open
};
