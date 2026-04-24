/**
 * 单小程序多身份：技工端 / 商家端分包路由与角色解析（与后端字段可渐进对齐）
 */

const USER_TAB = '/pages/user/user';

function normalizeRoles(user) {
  if (!user) return ['user'];
  if (Array.isArray(user.roles) && user.roles.length) {
    return [...new Set(user.roles.map((r) => String(r).trim()).filter(Boolean))];
  }
  const r = user.role;
  if (r == null || r === '') return ['user'];
  if (typeof r === 'string' && r.indexOf(',') !== -1) {
    return [...new Set(r.split(',').map((s) => s.trim()).filter(Boolean))];
  }
  return [String(r)];
}

function hasRole(user, role) {
  return normalizeRoles(user).indexOf(role) !== -1;
}

/** 是否具备技工工作台能力：显式角色 或 审核通过状态 */
function canUseWorkerPortal(user) {
  if (!user) return false;
  if (hasRole(user, 'worker') || hasRole(user, 'admin')) return true;
  const st = user.worker_status || user.workerStatus;
  if (st === 'approved' || st === 1 || st === 'approved_worker') return true;
  return false;
}

/** 是否具备商家工作台能力 */
function canUseMerchantPortal(user) {
  if (!user) return false;
  if (hasRole(user, 'merchant') || hasRole(user, 'admin')) return true;
  const sid = user.shop_id != null ? user.shop_id : user.shopId;
  if (sid != null && sid !== '') return true;
  const st = user.merchant_status || user.merchantStatus || user.shop_status || user.shopStatus;
  if (st === 'approved' || st === 'active' || st === 1) return true;
  return false;
}

/** 是否具备集市商家工作台能力 */
function canUseMarketPortal(user) {
  if (!user) return false;
  if (hasRole(user, 'market_merchant') || hasRole(user, 'admin')) return true;
  const sid = user.shop_id != null ? user.shop_id : user.shopId;
  if (sid != null && sid !== '') return true;
  const st = user.merchant_status || user.merchantStatus || user.shop_status || user.shopStatus;
  if (st === 'approved' || st === 'active' || st === 1) return true;
  return false;
}

/** 是否具备服务商工作台能力（独立于集市商家） */
function canUseServiceProviderPortal(user) {
  if (!user) return false;
  if (hasRole(user, 'service_provider') || hasRole(user, 'admin')) return true;
  const st = user.service_provider_status || user.serviceProviderStatus;
  if (st === 'approved' || st === 'active' || st === 1) return true;
  return false;
}

function mergePortalFlags(target, src) {
  if (!target || !src || typeof src !== 'object') return target;
  const next = Object.assign({}, target);
  const keys = [
    'worker_status', 'workerStatus',
    'merchant_status', 'merchantStatus',
    'shop_status', 'shopStatus',
    'shop_id', 'shopId',
    'roles', 'role'
  ];
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(src, k) && src[k] !== undefined) {
      next[k] = src[k];
    }
  });
  if (src.roles != null) next.roles = src.roles;
  return next;
}

function requireLoginToast() {
  wx.showToast({ title: '请先登录', icon: 'none' });
}

function navigateToWorkerHome() {
  const token = wx.getStorageSync('token');
  if (!token) {
    requireLoginToast();
    return;
  }
  wx.navigateTo({
    url: '/package-worker/pages/worker-home/worker-home'
  });
}

function navigateToMerchantHome() {
  const token = wx.getStorageSync('token');
  if (!token) {
    requireLoginToast();
    return;
  }
  wx.navigateTo({
    url: '/package-merchant/pages/merchant-home/merchant-home'
  });
}

function navigateToMarketHome() {
  const token = wx.getStorageSync('token');
  if (!token) {
    requireLoginToast();
    return;
  }
  wx.navigateTo({
    url: '/package-market/pages/market-home/market-home'
  });
}

function navigateToServiceProviderHome() {
  const token = wx.getStorageSync('token');
  if (!token) {
    requireLoginToast();
    return;
  }
  wx.navigateTo({
    url: '/package-service-provider/pages/sp-home/sp-home'
  });
}

function backToUserTab() {
  wx.switchTab({ url: USER_TAB });
}

function workerTabUrl(path) {
  return `/package-worker/pages/${path}/${path}`;
}

function merchantTabUrl(path) {
  return `/package-merchant/pages/${path}/${path}`;
}

function marketTabUrl(path) {
  return `/package-market/pages/${path}/${path}`;
}

function serviceProvTabUrl(path) {
  return `/package-service-provider/pages/${path}/${path}`;
}

module.exports = {
  normalizeRoles,
  hasRole,
  canUseWorkerPortal,
  canUseMerchantPortal,
  canUseMarketPortal,
  canUseServiceProviderPortal,
  mergePortalFlags,
  navigateToWorkerHome,
  navigateToMerchantHome,
  navigateToMarketHome,
  navigateToServiceProviderHome,
  backToUserTab,
  workerTabUrl,
  merchantTabUrl,
  marketTabUrl,
  serviceProvTabUrl,
  USER_TAB
};
