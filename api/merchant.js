/**
 * 商家后台模块 API（集市商家端）
 * 对应后端文档：九、商家后台模块
 */
const { get, post, patch } = require('../util.js');

/**
 * 获取仪表盘数据
 * GET /market/merchant/dashboard
 */
const getDashboard = () => {
  return get('/market/merchant/dashboard');
};

/**
 * 获取店铺信息
 * GET /market/merchant/shop
 */
const getShop = () => {
  return get('/market/merchant/shop');
};

/**
 * 更新店铺信息
 * PATCH /market/merchant/shop
 */
const updateShop = (data) => {
  return patch('/market/merchant/shop', data);
};

/**
 * 获取商品列表
 * GET /market/merchant/goods
 */
const getGoods = (params) => {
  return get('/market/merchant/goods', params);
};

/**
 * 创建商品
 * POST /market/merchant/goods
 */
const createGoods = (data) => {
  return post('/market/merchant/goods', data);
};

/**
 * 获取商品详情
 * GET /market/merchant/goods/:id
 */
const getGoodsDetail = (id) => {
  return get(`/market/merchant/goods/${id}`);
};

/**
 * 更新商品
 * PATCH /market/merchant/goods/:id
 */
const updateGoods = (id, data) => {
  return patch(`/market/merchant/goods/${id}`, data);
};

/**
 * 补货
 * POST /market/merchant/goods/:id/restock
 */
const restockGoods = (id, data) => {
  return post(`/market/merchant/goods/${id}/restock`, data);
};

/**
 * 上下架
 * POST /market/merchant/goods/:id/shelf
 */
const shelfGoods = (id, data) => {
  return post(`/market/merchant/goods/${id}/shelf`, data);
};

/**
 * 获取订单列表
 * GET /market/merchant/orders
 */
const getOrders = (params) => {
  return get('/market/merchant/orders', params);
};

/**
 * 获取订单详情
 * GET /market/merchant/orders/:orderNo
 */
const getOrderDetail = (orderNo) => {
  return get(`/market/merchant/orders/${orderNo}`);
};

/**
 * 订单操作
 * POST /market/merchant/orders/:orderNo/action
 */
const orderAction = (orderNo, data) => {
  return post(`/market/merchant/orders/${orderNo}/action`, data);
};

/**
 * 获取支付记录
 * GET /market/merchant/payments
 */
const getPayments = (params) => {
  return get('/market/merchant/payments', params);
};

/**
 * 获取客户列表
 * GET /market/merchant/customers/list
 */
const getCustomers = (params) => {
  return get('/market/merchant/customers/list', params);
};

/**
 * 获取客户订单
 * GET /market/merchant/customers/:id/orders
 */
const getCustomerOrders = (customerId, params) => {
  return get(`/market/merchant/customers/${customerId}/orders`, params);
};

/**
 * 获取客户统计
 * GET /market/merchant/customers/:id/stats
 */
const getCustomerStats = (customerId) => {
  return get(`/market/merchant/customers/${customerId}/stats`);
};

/**
 * 获取优惠券列表
 * GET /market/merchant/marketing/coupons
 */
const getCoupons = (params) => {
  return get('/market/merchant/marketing/coupons', params);
};

/**
 * 创建优惠券
 * POST /market/merchant/marketing/coupons
 */
const createCoupon = (data) => {
  return post('/market/merchant/marketing/coupons', data);
};

/**
 * 更新优惠券
 * PUT /market/merchant/marketing/coupons/:id
 */
const updateCoupon = (id, data) => {
  return post(`/market/merchant/marketing/coupons/${id}`, data);
};

/**
 * 删除优惠券
 * DELETE /market/merchant/marketing/coupons/:id
 */
const deleteCoupon = (id) => {
  return post(`/market/merchant/marketing/coupons/${id}`);
};

/**
 * 获取营销统计
 * GET /market/merchant/marketing/stats
 */
const getMarketingStats = (params) => {
  return get('/market/merchant/marketing/stats', params);
};

/**
 * 获取退款列表
 * GET /market/merchant/refunds/list
 */
const getRefunds = (params) => {
  return get('/market/merchant/refunds/list', params);
};

/**
 * 获取退款详情
 * GET /market/merchant/refunds/:id
 */
const getRefundDetail = (id) => {
  return get(`/market/merchant/refunds/${id}`);
};

/**
 * 同意退款
 * POST /market/merchant/refunds/:id/approve
 */
const approveRefund = (id) => {
  return post(`/market/merchant/refunds/${id}/approve`);
};

/**
 * 拒绝退款
 * POST /market/merchant/refunds/:id/reject
 */
const rejectRefund = (id) => {
  return post(`/market/merchant/refunds/${id}/reject`);
};

/**
 * 获取退款统计
 * GET /market/merchant/refunds/stats/summary
 */
const getRefundStats = () => {
  return get('/market/merchant/refunds/stats/summary');
};

module.exports = {
  getDashboard,
  getShop,
  updateShop,
  getGoods,
  createGoods,
  getGoodsDetail,
  updateGoods,
  restockGoods,
  shelfGoods,
  getOrders,
  getOrderDetail,
  orderAction,
  getPayments,
  getCustomers,
  getCustomerOrders,
  getCustomerStats,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getMarketingStats,
  getRefunds,
  getRefundDetail,
  approveRefund,
  rejectRefund,
  getRefundStats
};
