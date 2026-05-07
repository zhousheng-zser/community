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

/** 是否具备技工工作台能力：登录即可使用 */
function canUseWorkerPortal(user) {
  return !!user;
}

/** 是否具备商家工作台能力 */
function canUseMerchantPortal(user) {
  if (!user) return false;
  if (hasRole(user, 'admin')) return true;
  const st = user.merchant_status || user.merchantStatus || user.shop_status || user.shopStatus;
  if (st === 'approved' || st === 'active' || st === 1) return true;
  return false;
}

/** 是否具备集市商家工作台能力 */
function canUseMarketPortal(user) {
  if (!user) return false;
  if (hasRole(user, 'admin')) return true;
  const st = user.merchant_status != null ? user.merchant_status : user.merchantStatus;
  if (st === 'approved' || st === 'active' || st === 1) return true;
  return false;
}

/** 是否具备服务商工作台能力（独立于集市商家）：登录即可使用 */
function canUseServiceProviderPortal(user) {
  return !!user;
}

/** 是否具备推广者能力 */
function canUsePromoterPortal(user) {
  if (!user) return false;
  return hasRole(user, 'promoter') || hasRole(user, 'admin');
}

/** 是否具备区县合伙人能力 */
function canUseDistrictPartnerPortal(user) {
  if (!user) return false;
  return hasRole(user, 'district_partner') || hasRole(user, 'admin');
}

/** 是否具备市场合伙人能力 */
function canUseMarketPartnerPortal(user) {
  if (!user) return false;
  return hasRole(user, 'market_partner') || hasRole(user, 'admin');
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
  canUsePromoterPortal,
  canUseDistrictPartnerPortal,
  canUseMarketPartnerPortal,
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
