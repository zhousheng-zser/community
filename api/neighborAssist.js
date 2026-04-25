/**
 * 邻里帮帮模块 API
 * 对应后端文档：五、邻里帮帮模块
 */
const { get, post } = require('../utils/util.js');

/**
 * 创建帮帮订单
 * POST /neighbor-assist/orders
 */
const createAssistOrder = (data) => {
  return post('/neighbor-assist/orders', data);
};

/**
 * 获取我的帮帮订单
 * GET /neighbor-assist/orders/my
 */
const getMyAssistOrders = (params) => {
  return get('/neighbor-assist/orders/my', params);
};

/**
 * 获取技工待接单池
 * GET /neighbor-assist/orders/pool
 */
const getAssistPool = (params) => {
  return get('/neighbor-assist/orders/pool', params);
};

/**
 * 获取社区待接单池（面向同社区普通成员）
 * GET /neighbor-assist/orders/community-pool
 */
const getCommunityPool = (params) => {
  return get('/neighbor-assist/orders/community-pool', params);
};

/**
 * 订单详情
 * GET /neighbor-assist/orders/:id
 */
const getAssistOrderDetail = (id) => {
  return get(`/neighbor-assist/orders/${id}`);
};

/**
 * 技工抢单
 * POST /neighbor-assist/orders/:id/grab
 */
const grabAssistOrder = (id) => {
  return post(`/neighbor-assist/orders/${id}/grab`);
};

/**
 * 社区成员接单（非技工）
 * POST /neighbor-assist/orders/:id/community-grab
 */
const communityGrabOrder = (id) => {
  return post(`/neighbor-assist/orders/${id}/community-grab`);
};

/**
 * 接单方确认开始服务
 * POST /neighbor-assist/orders/:id/accept
 */
const acceptAssistOrder = (id) => {
  return post(`/neighbor-assist/orders/${id}/accept`);
};

/**
 * 完成订单
 * POST /neighbor-assist/orders/:id/complete
 */
const completeAssistOrder = (id) => {
  return post(`/neighbor-assist/orders/${id}/complete`);
};

/**
 * 发布人确认完成
 * POST /neighbor-assist/orders/:id/confirm
 */
const confirmAssistOrder = (id) => {
  return post(`/neighbor-assist/orders/${id}/confirm`);
};

/**
 * 模拟支付（开发联调用）
 * POST /neighbor-assist/orders/:id/pay
 */
const payAssistOrder = (id) => {
  return post(`/neighbor-assist/orders/${id}/pay`);
};

/**
 * 取消订单（仅未支付）
 * POST /neighbor-assist/orders/:id/cancel
 */
const cancelAssistOrder = (id) => {
  return post(`/neighbor-assist/orders/${id}/cancel`);
};

module.exports = {
  createAssistOrder,
  getMyAssistOrders,
  getAssistPool,
  getCommunityPool,
  getAssistOrderDetail,
  grabAssistOrder,
  communityGrabOrder,
  acceptAssistOrder,
  completeAssistOrder,
  confirmAssistOrder,
  payAssistOrder,
  cancelAssistOrder
};
