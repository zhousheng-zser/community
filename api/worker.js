/**
 * 技工端模块 API
 * 对应后端文档：十、技工端模块
 */
const { get, post, patch } = require('../utils/util.js');

/**
 * 技工入驻申请
 * POST /worker/apply
 */
const applyWorker = (data) => {
  return post('/worker/apply', data);
};

/**
 * 获取技工申请详情
 * GET /worker/application/me
 */
const getWorkerApplication = () => {
  return get('/worker/application/me');
};

/** 工作台头像与封面 */
const getMyProfile = () => get('/worker/profile/me');

const updateMyProfile = (data) => patch('/worker/profile/me', data);

/**
 * 获取订单列表
 * GET /worker/service-orders
 */
const getOrders = (params) => {
  return get('/worker/service-orders', params);
};

/**
 * 获取订单详情
 * GET /worker/service-orders/:id
 */
const getOrderDetail = (id) => {
  return get(`/worker/service-orders/${id}`);
};

/**
 * 接单
 * POST /worker/service-orders/:id/accept
 */
const acceptOrder = (id) => {
  return post(`/worker/service-orders/${id}/accept`);
};

/**
 * 拒单
 * POST /worker/service-orders/:id/reject
 */
const rejectOrder = (id, data) => {
  return post(`/worker/service-orders/${id}/reject`, data);
};

/**
 * 打卡
 * POST /worker/service-orders/:id/check-in
 */
const checkIn = (id, data) => {
  return post(`/worker/service-orders/${id}/check-in`, data);
};

/**
 * 上传凭证
 * POST /worker/service-orders/:id/evidence
 */
const uploadEvidence = (id, data) => {
  return post(`/worker/service-orders/${id}/evidence`, data);
};

/**
 * 完成订单
 * POST /worker/service-orders/:id/complete
 */
const completeOrder = (id) => {
  return post(`/worker/service-orders/${id}/complete`);
};

// ===== 服务管理 =====

/**
 * 获取我的服务列表
 * GET /worker/services
 */
const getMyServices = (params) => {
  return get('/worker/services', params);
};

/**
 * 创建服务
 * POST /worker/services
 */
const createService = (data) => {
  return post('/worker/services', data);
};

/**
 * 更新服务
 * PATCH /worker/services/:id
 */
const updateService = (id, data) => {
  return patch(`/worker/services/${id}`, data);
};

/**
 * 删除服务
 * POST /worker/services/:id/delete
 */
const deleteService = (id) => {
  return post(`/worker/services/${id}/delete`);
};

module.exports = {
  applyWorker,
  getWorkerApplication,
  getMyProfile,
  updateMyProfile,
  getOrders,
  getOrderDetail,
  acceptOrder,
  rejectOrder,
  checkIn,
  uploadEvidence,
  completeOrder,
  getMyServices,
  createService,
  updateService,
  deleteService
};
