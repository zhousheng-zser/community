/**
 * 服务订单模块 API
 * 对应后端文档：四、服务订单模块
 */
const { get, post } = require('../util.js');

/**
 * 创建服务订单
 * POST /service-orders
 */
const createServiceOrder = (data) => {
  return post('/service-orders', data);
};

/**
 * 获取订单详情
 * GET /service-orders/:id
 */
const getOrderDetail = (id) => {
  return get(`/service-orders/${id}`);
};

/**
 * 获取我的订单列表
 * GET /service-orders/my
 */
const getMyOrders = (params) => {
  return get('/service-orders/my', params);
};

/**
 * 模拟支付
 * POST /service-orders/:id/mock-pay
 */
const mockPay = (id) => {
  return post(`/service-orders/${id}/mock-pay`);
};

/**
 * 确认完成
 * POST /service-orders/:id/confirm
 */
const confirmOrder = (id) => {
  return post(`/service-orders/${id}/confirm`);
};

module.exports = {
  createServiceOrder,
  getOrderDetail,
  getMyOrders,
  mockPay,
  confirmOrder
};
