/**
 * 服务订单模块 API
 * 对应后端文档：四、服务订单模块
 */
const { get, post } = require('../utils/util.js');

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

/** Alias for getMyOrders - used by service-orders-my page */
const getMyList = getMyOrders;

/**
 * 模拟支付（仅 enableMockPay 时前端可走 mock；后端 dev 亦保留接口）
 * POST /service-orders/:id/pay
 */
const mockPay = (id) => {
  return post(`/service-orders/${id}/pay`);
};

/**
 * 创建微信支付
 * POST /service-orders/payments/create
 */
const createPayment = (orderNo) => {
  return post('/service-orders/payments/create', { order_no: orderNo });
};

/**
 * 查询支付状态
 * GET /service-orders/payments/status
 */
const getPaymentStatus = (orderNo) => {
  return get('/service-orders/payments/status', { order_no: orderNo });
};

/**
 * 模拟支付成功（开发）
 * POST /service-orders/payments/mock-success
 */
const mockPaymentSuccess = (orderNo) => {
  return post('/service-orders/payments/mock-success', { order_no: orderNo });
};

/**
 * 确认完成
 * POST /service-orders/:id/confirm-complete
 */
const confirmOrder = (id) => {
  return post(`/service-orders/${id}/confirm-complete`);
};

module.exports = {
  createServiceOrder,
  getOrderDetail,
  getMyOrders,
  getMyList,
  mockPay,
  createPayment,
  getPaymentStatus,
  mockPaymentSuccess,
  confirmOrder
};
