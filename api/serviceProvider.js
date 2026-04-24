/**
 * 服务商后台模块 API
 * 对应后端文档：八、服务商后台模块
 */
const { get, post, patch } = require('../util.js');

/**
 * 获取个人信息
 * GET /service-provider-portal/me
 */
const getProfile = () => {
  return get('/service-provider-portal/me');
};

/**
 * 更新个人信息
 * PATCH /service-provider-portal/profile
 */
const updateProfile = (data) => {
  return patch('/service-provider-portal/profile', data);
};

/**
 * 获取仪表盘数据
 * GET /service-provider-portal/dashboard
 */
const getDashboard = () => {
  return get('/service-provider-portal/dashboard');
};

/**
 * 获取服务分类
 * GET /service-provider-portal/categories
 */
const getCategories = () => {
  return get('/service-provider-portal/categories');
};

/**
 * 获取服务列表
 * GET /service-provider-portal/services
 */
const getServices = (params) => {
  return get('/service-provider-portal/services', params);
};

/**
 * 创建服务
 * POST /service-provider-portal/services
 */
const createService = (data) => {
  return post('/service-provider-portal/services', data);
};

/**
 * 获取服务详情
 * GET /service-provider-portal/services/:id
 */
const getServiceDetail = (id) => {
  return get(`/service-provider-portal/services/${id}`);
};

/**
 * 更新服务
 * PATCH /service-provider-portal/services/:id
 */
const updateService = (id, data) => {
  return patch(`/service-provider-portal/services/${id}`, data);
};

/**
 * 获取订单列表
 * GET /service-provider-portal/orders
 */
const getOrders = (params) => {
  return get('/service-provider-portal/orders', params);
};

/**
 * 获取订单详情
 * GET /service-provider-portal/orders/:id
 */
const getOrderDetail = (id) => {
  return get(`/service-provider-portal/orders/${id}`);
};

/**
 * 接单
 * POST /service-provider-portal/orders/:id/accept
 */
const acceptOrder = (id) => {
  return post(`/service-provider-portal/orders/${id}/accept`);
};

/**
 * 打卡
 * POST /service-provider-portal/orders/:id/check-in
 */
const checkIn = (id, data) => {
  return post(`/service-provider-portal/orders/${id}/check-in`, data);
};

/**
 * 上传凭证
 * POST /service-provider-portal/orders/:id/evidence
 */
const uploadEvidence = (id, data) => {
  return post(`/service-provider-portal/orders/${id}/evidence`, data);
};

/**
 * 完成订单
 * POST /service-provider-portal/orders/:id/complete
 */
const completeOrder = (id) => {
  return post(`/service-provider-portal/orders/${id}/complete`);
};

/**
 * 获取技工列表
 * GET /service-provider-portal/workers/list
 */
const getWorkers = (params) => {
  return get('/service-provider-portal/workers/list', params);
};

/**
 * 获取技工详情
 * GET /service-provider-portal/workers/:id
 */
const getWorkerDetail = (id) => {
  return get(`/service-provider-portal/workers/${id}`);
};

/**
 * 更新技工状态
 * PUT /service-provider-portal/workers/:id/status
 */
const updateWorkerStatus = (id, data) => {
  return post(`/service-provider-portal/workers/${id}/status`, data);
};

/**
 * 获取技工统计
 * GET /service-provider-portal/workers/:id/stats
 */
const getWorkerStats = (id) => {
  return get(`/service-provider-portal/workers/${id}/stats`);
};

/**
 * 收入汇总
 * GET /service-provider-portal/finance/income/summary
 */
const getIncomeSummary = (params) => {
  return get('/service-provider-portal/finance/income/summary', params);
};

/**
 * 收入明细列表
 * GET /service-provider-portal/finance/income/list
 */
const getIncomeList = (params) => {
  return get('/service-provider-portal/finance/income/list', params);
};

/**
 * 每日收入统计
 * GET /service-provider-portal/finance/income/daily
 */
const getIncomeDaily = (params) => {
  return get('/service-provider-portal/finance/income/daily', params);
};

/**
 * 获取账户余额
 * GET /service-provider-portal/finance/balance
 */
const getBalance = () => {
  return get('/service-provider-portal/finance/balance');
};

module.exports = {
  getProfile,
  updateProfile,
  getDashboard,
  getCategories,
  getServices,
  createService,
  getServiceDetail,
  updateService,
  getOrders,
  getOrderDetail,
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
