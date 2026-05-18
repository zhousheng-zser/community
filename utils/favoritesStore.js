/**
 * 收藏夹服务 — 服务端优先 + 本地兜底
 *
 * 优先使用后端 API（需要 JWT 登录态）。
 * 若 API 返回 404（路由未实现）或网络失败，自动降级为本地 Storage 存储。
 *
 * API 文档：doc/前端对接_集市商品收藏夹.md
 */
const util = require('./util.js');
const userSession = require('./userSession.js');

// ─── 本地 Storage 兜底（按 userId 隔离）──────────────────────────────────────
const LOCAL_KEY_BASE = 'user_favorites_v2';
const LOCAL_MAX = 300;

function localKey() {
  return userSession.scopedStorageKey(LOCAL_KEY_BASE);
}

function localGet() {
  try {
    const arr = wx.getStorageSync(localKey());
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

function localSave(arr) {
  try { wx.setStorageSync(localKey(), arr); } catch (e) {}
}

function localHas(goodsId) {
  return localGet().some(x => String(x.goodsId) === String(goodsId));
}

function localAdd(goodsId, shopId) {
  let list = localGet().filter(x => String(x.goodsId) !== String(goodsId));
  list.unshift({ goodsId: Number(goodsId), shopId: Number(shopId) || 0, t: Date.now() });
  list = list.slice(0, LOCAL_MAX);
  localSave(list);
}

function localRemove(goodsId) {
  localSave(localGet().filter(x => String(x.goodsId) !== String(goodsId)));
}

// ─── 标识 API 是否可用（避免每次都等 404 超时）──────────────────────────────
let _apiAvailable = null; // null=未知, true=可用, false=不可用

function markApiUnavailable() {
  _apiAvailable = false;
  // 10 分钟后重置，允许重试（后端上线后自动恢复）
  setTimeout(() => { _apiAvailable = null; }, 10 * 60 * 1000);
}

function markApiAvailable() {
  _apiAvailable = true;
}

// ─── 公共方法 ────────────────────────────────────────────────────────────────

const KIND_LABELS = {
  market_goods: '集市商品',
  push_goods: '店铺商品',
  worker: '技工',
  service: '服务',
  market_shop: '集市店铺',
  service_provider: '服务商'
};

/** 是否已登录（检查本地 token） */
function isLoggedIn() {
  try { return !!wx.getStorageSync('token'); } catch (e) { return false; }
}

/**
 * 批量查询收藏状态
 * @param {number[]} goodsIds
 * @returns {Promise<Object>} { "101": true, "102": false }
 */
async function fetchStatus(goodsIds) {
  if (!goodsIds || goodsIds.length === 0) return {};

  // 如果 API 已知不可用，直接走本地
  if (_apiAvailable === false || !isLoggedIn()) {
    const map = {};
    goodsIds.forEach(id => { map[String(id)] = localHas(id); });
    return map;
  }

  try {
    const res = await util.get('market/favorites/status', {
      goods_ids: goodsIds.join(',')
    });
    markApiAvailable();
    return (res && res.favorited) || res || {};
  } catch (e) {
    // 404 = 后端接口未实现，降级本地
    if (e && (e.errno === 404 || (e.errmsg && e.errmsg.includes('404')))) {
      markApiUnavailable();
    }
    const map = {};
    goodsIds.forEach(id => { map[String(id)] = localHas(id); });
    return map;
  }
}

/**
 * 查询单个商品是否已收藏
 * @param {number} goodsId
 * @returns {Promise<boolean>}
 */
async function has(goodsId) {
  if (!goodsId) return false;
  const map = await fetchStatus([goodsId]);
  return !!map[String(goodsId)];
}

/**
 * 查询收藏列表（分页）
 * @param {Object} options - { page, page_size, shop_id }
 * @returns {Promise<{list: Array, total: number, isLocal: boolean}>}
 */
async function fetchList(options = {}) {
  if (_apiAvailable === false || !isLoggedIn()) {
    // 从本地构造列表
    const all = localGet();
    return { list: all, total: all.length, isLocal: true };
  }

  try {
    const res = await util.get('market/favorites', {
      page: options.page || 1,
      page_size: options.page_size || 20,
      ...(options.shop_id ? { shop_id: options.shop_id } : {})
    });
    markApiAvailable();
    const list = (res && (res.list || (res.data && res.data.list) || [])) || [];
    const total = (res && (res.total || (res.data && res.data.total) || list.length)) || 0;
    return { list, total, isLocal: false };
  } catch (e) {
    if (e && (e.errno === 404 || (e.errmsg && e.errmsg.includes('404')))) {
      markApiUnavailable();
    }
    const all = localGet();
    return { list: all, total: all.length, isLocal: true };
  }
}

/**
 * 添加收藏
 * @param {number} goodsId
 * @param {number} [shopId]
 * @returns {Promise<boolean>}
 */
async function add(goodsId, shopId) {
  if (!isLoggedIn()) {
    wx.showToast({ title: '请先登录', icon: 'none' });
    return false;
  }

  if (_apiAvailable !== false) {
    try {
      const body = { goods_id: Number(goodsId) };
      if (shopId) body.shop_id = Number(shopId);
      await util.post('market/favorites', body);
      markApiAvailable();
      // 同步到本地（作为缓存）
      localAdd(goodsId, shopId);
      return true;
    } catch (e) {
      if (e && (e.errno === 404 || (e.errmsg && e.errmsg.includes('404')))) {
        markApiUnavailable();
        // 降级本地
      } else {
        wx.showToast({ title: e.errmsg || '收藏失败', icon: 'none' });
        return false;
      }
    }
  }

  // 本地兜底
  localAdd(goodsId, shopId);
  return true;
}

/**
 * 取消收藏
 * @param {number} goodsId
 * @returns {Promise<boolean>}
 */
async function remove(goodsId) {
  if (!isLoggedIn()) {
    wx.showToast({ title: '请先登录', icon: 'none' });
    return false;
  }

  if (_apiAvailable !== false) {
    try {
      await util.del(`market/favorites/${Number(goodsId)}`);
      markApiAvailable();
      localRemove(goodsId);
      return true;
    } catch (e) {
      if (e && (e.errno === 404 || (e.errmsg && e.errmsg.includes('404')))) {
        markApiUnavailable();
        // 降级本地
      } else {
        wx.showToast({ title: e.errmsg || '取消收藏失败', icon: 'none' });
        return false;
      }
    }
  }

  // 本地兜底
  localRemove(goodsId);
  return true;
}

/**
 * 切换收藏状态
 * @param {number} goodsId
 * @param {number} [shopId]
 * @returns {Promise<boolean>} 操作后是否为「已收藏」
 */
async function toggle(goodsId, shopId) {
  const favorited = await has(goodsId);
  if (favorited) {
    const ok = await remove(goodsId);
    return ok ? false : true;
  } else {
    const ok = await add(goodsId, shopId);
    return ok ? true : false;
  }
}

module.exports = {
  KIND_LABELS,
  isLoggedIn,
  fetchList,
  fetchStatus,
  has,
  add,
  remove,
  toggle
};
