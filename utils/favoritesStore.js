/**
 * 本地收藏（与足迹同结构：kind / title / cover / url）
 */
const KEY = 'user_favorites_v1';
const MAX = 200;

const KIND_LABELS = {
  market_goods: '集市商品',
  push_goods: '店铺商品',
  worker: '技工',
  service: '服务',
  market_shop: '集市店铺',
  service_provider: '服务商'
};

function getList() {
  try {
    const arr = wx.getStorageSync(KEY);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function saveList(arr) {
  try {
    wx.setStorageSync(KEY, arr);
  } catch (e) {}
}

function has(dedupeKey) {
  const k = String(dedupeKey || '');
  if (!k) return false;
  return getList().some((x) => x && x.dedupeKey === k);
}

/**
 * @param {Object} opt — 同 browseFootprint.record
 */
function add(opt) {
  if (!opt || !opt.kind || !opt.dedupeKey || !opt.url) return;
  const title = String(opt.title || '').trim() || '收藏项';
  const cover = opt.cover != null ? String(opt.cover) : '';
  const url = String(opt.url);
  if (!url.startsWith('/')) return;
  const row = {
    kind: opt.kind,
    dedupeKey: String(opt.dedupeKey),
    title,
    cover,
    url,
    t: Date.now()
  };
  let list = getList().filter((x) => x && x.dedupeKey !== row.dedupeKey);
  list.unshift(row);
  list = list.slice(0, MAX);
  saveList(list);
}

function remove(dedupeKey) {
  const k = String(dedupeKey || '');
  if (!k) return;
  saveList(getList().filter((x) => x && x.dedupeKey !== k));
}

/** @returns {boolean} 收藏后是否为「已收藏」 */
function toggle(opt) {
  if (!opt || !opt.dedupeKey) return false;
  const k = String(opt.dedupeKey);
  if (has(k)) {
    remove(k);
    return false;
  }
  add(opt);
  return true;
}

function clear() {
  try {
    wx.removeStorageSync(KEY);
  } catch (e) {}
}

function count() {
  return getList().length;
}

function open(item) {
  if (!item || !item.url) return;
  wx.navigateTo({
    url: item.url,
    fail: () => {
      wx.showToast({ title: '页面暂不可用', icon: 'none' });
    }
  });
}

module.exports = {
  KIND_LABELS,
  add,
  remove,
  toggle,
  has,
  getList,
  clear,
  count,
  open
};
