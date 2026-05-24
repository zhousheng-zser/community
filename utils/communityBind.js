/**
 * 小区绑定与当前选用 — 对接 /user/community-bindings（见 doc/后端接口文档-小区绑定与搜索.md）
 */
const api = require('../api/index.js');
const { withTimeout } = require('./asyncTimeout.js');
const {
  normalizeCommunityRow,
  findCommunityById,
  isPlaceholderCommunityName
} = require('./communitySearch.js');

const BINDINGS_FETCH_TIMEOUT_MS = 12000;

const MAX_BINDINGS = 3;
const STORAGE_ACTIVE_ID = 'active_community_id';
const STORAGE_ACTIVE_NAME = 'active_community_name';
const STORAGE_BOUND_COMMUNITY_ID = 'user_community_id';
const STORAGE_BOUND_COMMUNITY_NAME = 'user_community_name';
const STORAGE_LOCAL_BINDINGS = 'user_community_bindings_local';

const BIND_ERROR_MSG = {
  1001: '小区ID无效',
  1002: '小区不存在或已停用',
  1003: '最多绑定3个小区',
  1004: '已绑定该小区',
  1005: '未绑定该小区'
};

function apiErrorMessage(err, fallback) {
  const code = err && (err.errno != null ? err.errno : err.code);
  if (code != null && BIND_ERROR_MSG[code]) return BIND_ERROR_MSG[code];
  return (err && (err.msg || err.errmsg || err.message)) || fallback;
}

function clearStaleCommunityState() {
  try {
    wx.removeStorageSync(STORAGE_ACTIVE_ID);
    wx.removeStorageSync(STORAGE_ACTIVE_NAME);
    wx.removeStorageSync(STORAGE_BOUND_COMMUNITY_ID);
    wx.removeStorageSync(STORAGE_BOUND_COMMUNITY_NAME);
    wx.removeStorageSync(STORAGE_LOCAL_BINDINGS);
    wx.removeStorageSync('portal_location_community_id');
  } catch (e) {
    /* ignore */
  }
  const app = getApp();
  if (app && app.globalData && app.globalData.user) {
    app.globalData.user = Object.assign({}, app.globalData.user, {
      communityId: null,
      community_id: null
    });
  }
}

function applyBoundCommunityToApp(app, communityId, communityName) {
  const cid = Number(communityId);
  if (!Number.isFinite(cid) || cid <= 0) return;
  const name = String(communityName || '').trim();
  if (!name || isPlaceholderCommunityName(name)) return;

  const g = app && app.globalData;
  if (g && g.user) {
    g.user = Object.assign({}, g.user, {
      communityId: cid,
      community_id: cid
    });
  }
  try {
    wx.setStorageSync(STORAGE_BOUND_COMMUNITY_ID, String(cid));
    wx.setStorageSync(STORAGE_ACTIVE_ID, String(cid));
    wx.setStorageSync(STORAGE_BOUND_COMMUNITY_NAME, name);
    wx.setStorageSync(STORAGE_ACTIVE_NAME, name);
    wx.setStorageSync('portal_location_community_id', cid);
    wx.setStorageSync('portal_last_location_text', name);
    wx.removeStorageSync('market_user_location_manual');
  } catch (e) {
    /* ignore */
  }
}

function getStoredActiveId() {
  try {
    const n = Number(wx.getStorageSync(STORAGE_ACTIVE_ID));
    if (Number.isFinite(n) && n > 0) return n;
  } catch (e) {
    /* ignore */
  }
  return null;
}

function getActiveCommunity() {
  const id = getStoredActiveId();
  let name = '';
  try {
    name = wx.getStorageSync(STORAGE_ACTIVE_NAME) || '';
  } catch (e) {
    /* ignore */
  }
  if (!name || isPlaceholderCommunityName(name)) {
    name = getBoundCommunityName();
  }
  if (isPlaceholderCommunityName(name)) name = '';
  return id && name ? { id, name } : id ? { id, name: '' } : null;
}

function getActiveCommunityDisplayName() {
  const a = getActiveCommunity();
  if (a && a.name) return a.name;
  return '';
}

function getBoundCommunityName() {
  try {
    const n =
      wx.getStorageSync(STORAGE_BOUND_COMMUNITY_NAME) ||
      wx.getStorageSync(STORAGE_ACTIVE_NAME) ||
      '';
    return isPlaceholderCommunityName(n) ? '' : n;
  } catch (e) {
    return '';
  }
}

function readLocalBindings() {
  try {
    const raw = wx.getStorageSync(STORAGE_LOCAL_BINDINGS);
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    return [];
  }
}

function writeLocalBindings(list) {
  try {
    wx.setStorageSync(STORAGE_LOCAL_BINDINGS, list.slice(0, MAX_BINDINGS));
  } catch (e) {
    /* ignore */
  }
}

function parseBindingsPayload(res) {
  if (!res || typeof res !== 'object') return { list: [], active_community_id: null };
  if (Array.isArray(res.list)) {
    return {
      list: res.list,
      active_community_id:
        res.active_community_id != null
          ? res.active_community_id
          : res.activeCommunityId
    };
  }
  if (res.data && Array.isArray(res.data.list)) {
    return {
      list: res.data.list,
      active_community_id:
        res.data.active_community_id != null
          ? res.data.active_community_id
          : res.activeCommunityId
    };
  }
  return { list: [], active_community_id: null };
}

function normalizeBindingRow(row, activeCommunityId) {
  const c = row.community || {};
  const communityId = Number(
    row.community_id != null ? row.community_id : c.id
  );
  if (!Number.isFinite(communityId) || communityId <= 0) return null;
  const activeId = activeCommunityId != null ? Number(activeCommunityId) : null;
  let name = row.community_name || c.name || row.name || '';
  if (isPlaceholderCommunityName(name)) name = '';
  return {
    community_id: communityId,
    name,
    address: c.address || row.address || '',
    city: c.city || row.city || '',
    district: c.district || row.district || '',
    is_active:
      row.is_active === true ||
      row.isActive === true ||
      (activeId != null && communityId === activeId)
  };
}

async function enrichBindingsWithCatalog(bindings) {
  const out = [];
  for (const b of bindings || []) {
    let name = b.name;
    if (!name || isPlaceholderCommunityName(name)) {
      const hit = await findCommunityById(b.community_id);
      if (!hit) continue;
      name = hit.name;
    }
    out.push({ ...b, name });
  }
  return out;
}

/**
 * @returns {Promise<{ list: Array, bindingsApiAvailable: boolean }>}
 */
async function fetchBindings() {
  const token = wx.getStorageSync('token');
  if (!token) {
    const local = readLocalBindings()
      .map((b) => normalizeBindingRow(b, getStoredActiveId()))
      .filter((b) => b && b.name && !isPlaceholderCommunityName(b.name));
    writeLocalBindings(local);
    return { list: local, bindingsApiAvailable: false };
  }

  try {
    const res = await withTimeout(
      api.communityBinding.getCommunityBindings(),
      BINDINGS_FETCH_TIMEOUT_MS,
      '绑定列表'
    );
    const { list, active_community_id: activeFromApi } = parseBindingsPayload(res);
    const activeId =
      activeFromApi != null
        ? Number(activeFromApi)
        : list.find((x) => x.is_active)?.community_id;

    let normalized = list
      .map((row) => normalizeBindingRow(row, activeId))
      .filter(Boolean);
    normalized = await enrichBindingsWithCatalog(normalized);
    writeLocalBindings(normalized);

    if (activeId != null && Number.isFinite(activeId) && activeId > 0) {
      const hit = normalized.find((x) => x.community_id === activeId);
      if (hit && hit.name) {
        applyBoundCommunityToApp(getApp(), activeId, hit.name);
      }
    }

    return { list: normalized, bindingsApiAvailable: true };
  } catch (e) {
    const code = e && (e.errno || e.statusCode);
    const bindingsApiAvailable = code !== 404;

    if (code === 404) {
      console.warn(
        '[communityBind] GET /user/community-bindings 未部署(404)，无法查询已绑定列表'
      );
    } else {
      console.warn('[communityBind] fetchBindings', e);
    }

    let cached = await enrichBindingsWithCatalog(readLocalBindings());
    if (cached.length > 0) {
      writeLocalBindings(cached);
      return { list: cached, bindingsApiAvailable: false };
    }

    try {
      const profile = await withTimeout(
        api.user.getUserProfile(),
        BINDINGS_FETCH_TIMEOUT_MS,
        '用户资料'
      );
      const cid =
        profile.community_id != null ? profile.community_id : profile.communityId;
      const n = Number(cid);
      if (Number.isFinite(n) && n > 0) {
        const resolved = await findCommunityById(n);
        if (!resolved) {
          console.warn(
            '[communityBind] user.profile.community_id=',
            n,
            '在小区主数据中不存在，已清除本地展示'
          );
          clearStaleCommunityState();
          return { list: [], bindingsApiAvailable: false };
        }
        const one = [
          {
            community_id: n,
            name: resolved.name,
            address: resolved.address || '',
            city: resolved.city || '',
            district: resolved.district || '',
            is_active: true
          }
        ];
        writeLocalBindings(one);
        applyBoundCommunityToApp(getApp(), n, resolved.name);
        return { list: one, bindingsApiAvailable: false };
      }
    } catch (e2) {
      /* ignore */
    }

    clearStaleCommunityState();
    return { list: [], bindingsApiAvailable: false };
  }
}

async function setActiveCommunity(communityId, communityName) {
  const cid = Number(communityId);
  if (!Number.isFinite(cid) || cid <= 0) throw new Error('无效的小区');
  let name = String(communityName || '').trim();
  if (!name || isPlaceholderCommunityName(name)) {
    const hit = await findCommunityById(cid);
    if (!hit) throw new Error('小区不存在或已停用');
    name = hit.name;
  }
  const token = wx.getStorageSync('token');

  if (token) {
    try {
      await api.communityBinding.setActiveUserCommunity(cid);
    } catch (e) {
      const code = e && (e.errno || e.statusCode);
      if (code !== 404) {
        throw new Error(apiErrorMessage(e, '切换失败'));
      }
      await api.user.updateProfileFields({ community_id: cid });
    }
  }

  applyBoundCommunityToApp(getApp(), cid, name);

  const locals = readLocalBindings().map((b) => ({
    ...b,
    is_active: Number(b.community_id) === cid
  }));
  if (!locals.some((b) => Number(b.community_id) === cid)) {
    locals.push({ community_id: cid, name, address: '', is_active: true });
  }
  writeLocalBindings(locals);

  return { id: cid, name };
}

async function bindCommunity(communityId, communityMeta) {
  const cid = Number(communityId);
  if (!Number.isFinite(cid) || cid <= 0) throw new Error('无效的小区');
  const meta = communityMeta || {};
  let name = meta.name || '';
  if (!name) {
    const hit = await findCommunityById(cid);
    if (!hit) throw new Error(BIND_ERROR_MSG[1002]);
    name = hit.name;
  }
  const token = wx.getStorageSync('token');
  if (!token) {
    throw new Error('请先登录');
  }

  const { list: bindings } = await fetchBindings();
  if (
    bindings.length >= MAX_BINDINGS &&
    !bindings.some((b) => Number(b.community_id) === cid)
  ) {
    throw new Error(BIND_ERROR_MSG[1003]);
  }

  try {
    await api.communityBinding.bindUserCommunity(cid);
  } catch (e) {
    const code = e && (e.errno || e.statusCode);
    if (code === 404) {
      throw new Error('绑定接口未上线，请联系管理员部署 community-bindings');
    }
    throw new Error(apiErrorMessage(e, '绑定失败'));
  }

  await setActiveCommunity(cid, name);
  const refreshed = await fetchBindings();
  return { id: cid, name, bindingsApiAvailable: refreshed.bindingsApiAvailable };
}

async function unbindCommunity(communityId) {
  const cid = Number(communityId);
  if (!Number.isFinite(cid) || cid <= 0) throw new Error('无效的小区');
  const token = wx.getStorageSync('token');
  if (!token) throw new Error('请先登录');

  try {
    await api.communityBinding.unbindUserCommunity(cid);
  } catch (e) {
    const code = e && (e.errno || e.statusCode);
    if (code === 404) {
      let locals = readLocalBindings().filter((b) => Number(b.community_id) !== cid);
      writeLocalBindings(locals);
      if (getStoredActiveId() === cid) {
        if (locals.length > 0) {
          await setActiveCommunity(locals[0].community_id, locals[0].name);
        } else {
          clearStaleCommunityState();
        }
      }
      return fetchBindings();
    }
    throw new Error(apiErrorMessage(e, '解绑失败'));
  }

  return fetchBindings();
}

function setPendingSelectionLocally(item) {
  const row = normalizeCommunityRow(item);
  if (!row) return null;
  return row;
}

module.exports = {
  MAX_BINDINGS,
  STORAGE_ACTIVE_ID,
  STORAGE_ACTIVE_NAME,
  STORAGE_BOUND_COMMUNITY_ID,
  STORAGE_BOUND_COMMUNITY_NAME,
  apiErrorMessage,
  clearStaleCommunityState,
  applyBoundCommunityToApp,
  getActiveCommunity,
  getActiveCommunityDisplayName,
  getBoundCommunityName,
  getStoredActiveId,
  fetchBindings,
  setActiveCommunity,
  bindCommunity,
  unbindCommunity,
  setPendingSelectionLocally
};
