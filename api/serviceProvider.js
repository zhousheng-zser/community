/**
 * 直约服务商后台模块 API
 * 后端路径前缀: /service-provider（兼容 /service-provider-portal）
 * 认证: 普通用户 JWT
 */
const { get, post, patch } = require('../utils/util.js');

const BASE = '/service-provider';

/**
 * 交换服务商工作台 token
 * POST /service-provider-portal/token/exchange (或 /service-provider/token/exchange)
 */
const exchangeServiceProviderToken = async () => {
  const res = await post(`/service-provider-portal/token/exchange`);
  if (res && res.token) {
    wx.setStorageSync('service_provider_token', res.token);
  }
  return res;
};

/** 获取服务商个人信息（含 profile_id、shop_name 等） */
const getProfile = () => get(`${BASE}/me`);

/** 更新服务商信息 */
const updateProfile = (data) => patch(`${BASE}/profile`, data);

/**
 * 服务商入驻申请
 * POST /service-provider/apply
 */
const applyServiceProvider = (data) => post(`${BASE}/apply`, data);

/**
 * 获取服务商入驻申请详情
 * GET /service-provider/application/me
 */
const getServiceProviderApplication = () => get(`${BASE}/application/me`);

/** 获取仪表盘统计 */
const getDashboard = () => get(`${BASE}/dashboard`);

/** 获取服务分类列表 */
const getCategories = () => get(`${BASE}/categories`);

/* ──── 服务项目管理 ──── */

/** 获取服务列表 */
const getServices = (params) => get(`${BASE}/services`, params);

/** 创建服务 */
const createService = (data) => post(`${BASE}/services`, data);

/** 获取服务详情 */
const getServiceDetail = (id) => get(`${BASE}/services/${id}`);

/** 更新服务 */
const updateService = (id, data) => patch(`${BASE}/services/${id}`, data);

/** 上/下架服务 POST /services/:id/shelf */
const shelfService = (id, data) => post(`${BASE}/services/${id}/shelf`, data || {});

/* ──── 订单管理 ──── */

/** 获取订单列表 */
const getOrders = (params) => get(`${BASE}/orders`, params);

/** 获取订单详情 */
const getOrderDetail = (id) => get(`${BASE}/orders/${id}`);

/** 统一订单操作 POST /orders/:id/action */
const orderAction = (id, data) => post(`${BASE}/orders/${id}/action`, data);

/** 接单 */
const acceptOrder = (id) => orderAction(id, { action: 'accept' });

/** 打卡（到达现场） */
const checkIn = (id, data) => orderAction(id, Object.assign({ action: 'check-in' }, data || {}));

/** 上传凭证 */
const uploadEvidence = (id, data) => orderAction(id, Object.assign({ action: 'evidence' }, data || {}));

/** 完成服务 */
const completeOrder = (id, data) => orderAction(id, Object.assign({ action: 'complete' }, data || {}));

/* ──── 技工管理 ──── */

const getWorkers = (params) => get(`${BASE}/workers/list`, params);
const getWorkerDetail = (id) => get(`${BASE}/workers/${id}`);
const updateWorkerStatus = (id, data) => post(`${BASE}/workers/${id}/status`, data);
const getWorkerStats = (id) => get(`${BASE}/workers/${id}/stats`);

/* ──── 财务 ──── */

const getIncomeSummary = (params) => get(`${BASE}/finance/income/summary`, params);
const getIncomeList = (params) => get(`${BASE}/finance/income/list`, params);
const getIncomeDaily = (params) => get(`${BASE}/finance/income/daily`, params);
const getBalance = () => get(`${BASE}/finance/balance`);

module.exports = {
  exchangeServiceProviderToken,
  getProfile,
  updateProfile,
  applyServiceProvider,
  getServiceProviderApplication,
  getDashboard,
  getCategories,
  getServices,
  createService,
  getServiceDetail,
  updateService,
  shelfService,
  getOrders,
  getOrderDetail,
  orderAction,
  acceptOrder,
  checkIn,
  uploadEvidence,
  completeOrder,
  getWorkers,
  getWorkerDetail,
  updateWorkerStatus,
  getWorkerStats,
  getIncomeSummary,
  getIncomeList,
  getIncomeDaily,
  getBalance
};
