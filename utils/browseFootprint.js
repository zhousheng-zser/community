/**
 * 浏览足迹：后端优先存储 + 本地 Storage 备份
 */
const { get, post, del } = require('../utils/util.js');

const LOCAL_KEY = 'user_browse_footprint_v1';
const MAX = 50;

const KIND_LABELS = {
  market_goods: '集市商品',
  push_goods: '店铺商品',
  worker: '技工',
  service: '服务',
  market_shop: '集市店铺',
  service_provider: '服务商'
};

// ─── 本地存储操作 ────────────────────────────────────────────────────────────

function getLocalList() {
  try {
    const arr = wx.getStorageSync(LOCAL_KEY);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function saveLocalList(arr) {
  try { wx.setStorageSync(LOCAL_KEY, arr); } catch (e) {}
}

function isLoggedIn() {
  return !!wx.getStorageSync('token');
}

// ─── 后端 API ────────────────────────────────────────────────────────────────

function apiRecord(item) {
  return post('/user/footprints', {
    kind: item.kind,
    dedupe_key: item.dedupeKey,
    title: item.title,
    cover: item.cover,
    url: item.url
  }).catch(() => {});
}

function apiGetList(page, limit) {
  return get('/user/footprints', { page, limit });
}

function apiClear() {
  return del('/user/footprints').catch(() => {});
}

function apiBatchSync(list) {
  if (!list.length) return Promise.resolve();
  return post('/user/footprints/batch', {
    list: list.map(x => ({
      kind: x.kind,
      dedupe_key: x.dedupeKey,
      title: x.title,
      cover: x.cover,
      url: x.url
    }))
  }).catch(() => {});
}

// ─── 对外接口 ────────────────────────────────────────────────────────────────

/**
 * 记录一条足迹（同时写本地和后端）
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

  // 写本地备份
  let list = getLocalList().filter(x => x && x.dedupeKey !== row.dedupeKey);
  list.unshift(row);
  list = list.slice(0, MAX);
  saveLocalList(list);

  // 异步写后端
  if (isLoggedIn()) {
    apiRecord(row);
  }
}

/**
 * 获取足迹列表（优先后端，降级本地）
 */
async function getList() {
  if (!isLoggedIn()) return getLocalList();
  try {
    const res = await apiGetList(1, MAX);
    const data = res && res.data ? res.data : res;
    if (data && Array.isArray(data.list) && data.list.length > 0) {
      saveLocalList(data.list);
      return data.list;
    }
    return getLocalList();
  } catch (e) {
    return getLocalList();
  }
}

/**
 * 同步返回本地列表（用于同步场景）
 */
function getLocalListSync() {
  return getLocalList();
}

/**
 * 清空足迹
 */
function clear() {
  saveLocalList([]);
  if (isLoggedIn()) apiClear();
}

/**
 * 获取足迹数量（从本地快速返回）
 */
function count() {
  return getLocalList().length;
}

/**
 * 打开足迹项
 */
function open(item) {
  if (!item || !item.url) return;
  wx.navigateTo({
    url: item.url,
    fail: () => { wx.showToast({ title: '页面暂不可用', icon: 'none' }); }
  });
}

/**
 * 将本地足迹同步到后端（登录后调用一次）
 */
function syncLocalToServer() {
  if (!isLoggedIn()) return;
  const list = getLocalList();
  if (list.length > 0) apiBatchSync(list);
}

module.exports = {
  KIND_LABELS,
  record,
  getList,
  getLocalListSync,
  clear,
  count,
  open,
  syncLocalToServer
};
