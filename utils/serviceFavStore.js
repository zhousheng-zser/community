/**
 * 服务/服务商 收藏 — 后端优先 + 本地 Storage 备份
 */
const { get, post } = require('../utils/util.js');
const userSession = require('./userSession.js');

const LOCAL_KEY_BASE = 'user_service_favorites_v1';
const MAX = 200;

function localKey() {
  return userSession.scopedStorageKey(LOCAL_KEY_BASE);
}

const KIND_LABELS = {
  service: '到家服务',
  service_provider: '服务商'
};

// ─── 本地存储 ────────────────────────────────────────────────────────────────

function getAll() {
  try {
    const arr = wx.getStorageSync(localKey());
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

function saveAll(arr) {
  try { wx.setStorageSync(localKey(), arr); } catch (e) {}
}

function isLoggedIn() {
  return !!wx.getStorageSync('token');
}

// ─── 后端 API ────────────────────────────────────────────────────────────────

function apiAdd(opt) {
  return post('/user/service-favorites', {
    kind: opt.kind,
    target_id: opt.id,
    title: opt.title,
    cover: opt.cover,
    price: opt.price || '',
    url: opt.url
  }).catch(() => {});
}

function apiRemove(kind, id) {
  return post('/user/service-favorites/remove', { kind, target_id: id }).catch(() => {});
}

function apiGetList(kind, page, limit) {
  const params = { page, limit };
  if (kind) params.kind = kind;
  return get('/user/service-favorites', params);
}

function apiBatchSync(list) {
  if (!list.length) return Promise.resolve();
  return post('/user/service-favorites/batch', { list }).catch(() => {});
}

function apiCheck(kind, id) {
  return get('/user/service-favorites/check', { kind, target_id: id });
}

// ─── 对外接口 ────────────────────────────────────────────────────────────────

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

  if (isLoggedIn()) apiAdd(opt);
}

function remove(kind, id) {
  const dedupeKey = `${kind}:${id}`;
  saveAll(getAll().filter(x => x.dedupeKey !== dedupeKey));

  if (isLoggedIn()) apiRemove(kind, id);
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

/**
 * 获取收藏列表（优先后端，降级本地）
 */
async function fetchList(kind) {
  if (!isLoggedIn()) {
    const all = getAll();
    return kind ? all.filter(x => x.kind === kind) : all;
  }
  try {
    const res = await apiGetList(kind, 1, MAX);
    const data = res && res.data ? res.data : res;
    if (data && Array.isArray(data.list) && data.list.length > 0) {
      // 合并到本地缓存
      const remote = data.list;
      saveAll(remote);
      return kind ? remote.filter(x => x.kind === kind) : remote;
    }
    const all = getAll();
    return kind ? all.filter(x => x.kind === kind) : all;
  } catch (e) {
    const all = getAll();
    return kind ? all.filter(x => x.kind === kind) : all;
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

/**
 * 登录后将本地收藏同步到后端
 */
function syncLocalToServer() {
  if (!isLoggedIn()) return;
  const list = getAll();
  if (list.length > 0) apiBatchSync(list);
}

module.exports = {
  KIND_LABELS,
  add,
  remove,
  has,
  toggle,
  getList,
  fetchList,
  getAll,
  count,
  clear,
  open,
  syncLocalToServer
};
