/**
 * 技工端模块 API
 * 对应后端文档：十、技工端模块
 */
const { get, post } = require('../util.js');

/**
 * 获取订单列表
 * GET /worker/orders
 */
const getOrders = (params) => {
  return get('/worker/orders', params);
};

/**
 * 获取订单详情
 * GET /worker/orders/:id
 */
const getOrderDetail = (id) => {
  return get(`/worker/orders/${id}`);
};

/**
 * 接单
 * POST /worker/orders/:id/accept
 */
const acceptOrder = (id) => {
  return post(`/worker/orders/${id}/accept`);
};

/**
 * 拒单
 * POST /worker/orders/:id/reject
 */
const rejectOrder = (id, data) => {
  return post(`/worker/orders/${id}/reject`, data);
};

/**
 * 打卡
 * POST /worker/orders/:id/check-in
 */
const checkIn = (id, data) => {
  return post(`/worker/orders/${id}/check-in`, data);
};

/**
 * 上传凭证
 * POST /worker/orders/:id/evidence
 */
const uploadEvidence = (id, data) => {
  return post(`/worker/orders/${id}/evidence`, data);
};

/**
 * 完成订单
 * POST /worker/orders/:id/complete
 */
const completeOrder = (id) => {
  return post(`/worker/orders/${id}/complete`);
};

module.exports = {
  getOrders,
  getOrderDetail,
  acceptOrder,
  rejectOrder,
  checkIn,
  uploadEvidence,
  completeOrder
};
