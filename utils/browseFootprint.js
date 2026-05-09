/**
 * 本地浏览足迹（商品 / 店铺商品 / 服务 / 技工 / 店铺等），供个人中心「足迹」展示
 */
const KEY = 'user_browse_footprint_v1';
const MAX = 50;

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

/**
 * @param {Object} opt
 * @param {string} opt.kind
 * @param {string} opt.dedupeKey
 * @param {string} opt.title
 * @param {string} [opt.cover]
 * @param {string} opt.url 以 / 开头的绝对路径
 */
function record(opt) {
  if (!opt || !opt.kind || !opt.dedupeKey || !opt.url) return;
  const title = String(opt.title || '').trim() || '浏览项';
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
  record,
  getList,
  clear,
  count,
  open
};
