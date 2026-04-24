/**
 * 本地集市模块 API（用户端）
 * 对应后端文档：六、本地集市模块
 */
const { get, post, put, del } = require('../util.js');

/**
 * 商家入驻申请
 * POST /market/apply
 */
const applyMarketMerchant = (data) => {
  return post('/market/apply', data);
};

/**
 * 搜索商品/店铺
 * GET /market/search
 */
const searchMarket = (params) => {
  return get('/market/search', params);
};

/**
 * 获取店铺列表
 * GET /market/shops
 */
const getShopList = (params) => {
  return get('/market/shops', params);
};

/**
 * 获取店铺详情
 * GET /market/shops/:shopId
 */
const getShopDetail = (shopId) => {
  return get(`/market/shops/${shopId}`);
};

/**
 * 获取店铺商品
 * GET /market/shops/:shopId/goods
 */
const getShopGoods = (shopId, params) => {
  return get(`/market/shops/${shopId}/goods`, params);
};

/**
 * 获取商品详情
 * GET /market/goods/:goodsId
 */
const getGoodsDetail = (goodsId) => {
  return get(`/market/goods/${goodsId}`);
};

/**
 * 获取购物车
 * GET /market/cart
 */
const getCart = () => {
  return get('/market/cart');
};

/**
 * 添加购物车
 * POST /market/cart/items
 */
const addToCart = (data) => {
  return post('/market/cart/items', data);
};

/**
 * 更新购物车
 * PUT /market/cart/items/:itemId
 */
const updateCartItem = (itemId, data) => {
  return put(`/market/cart/items/${itemId}`, data);
};

/**
 * 删除购物车商品
 * DELETE /market/cart/items/:itemId
 */
const deleteCartItem = (itemId) => {
  return del(`/market/cart/items/${itemId}`);
};

/**
 * 清空购物车
 * DELETE /market/cart
 */
const clearCart = () => {
  return del('/market/cart');
};

/**
 * 订单预览
 * POST /market/orders/preview
 */
const previewOrder = (data) => {
  return post('/market/orders/preview', data);
};

/**
 * 创建订单
 * POST /market/orders
 */
const createOrder = (data) => {
  return post('/market/orders', data);
};

/**
 * 获取我的订单
 * GET /market/orders
 */
const getMyOrders = (params) => {
  return get('/market/orders', params);
};

/**
 * 获取订单详情
 * GET /market/orders/:orderNo
 */
const getOrderDetail = (orderNo) => {
  return get(`/market/orders/${orderNo}`);
};

/**
 * 取消订单
 * POST /market/orders/:orderNo/cancel
 */
const cancelOrder = (orderNo) => {
  return post(`/market/orders/${orderNo}/cancel`);
};

/**
 * 创建支付
 * POST /market/payments/create
 */
const createPayment = (data) => {
  return post('/market/payments/create', data);
};

/**
 * 查询支付状态
 * GET /market/payments/status
 */
const getPaymentStatus = (params) => {
  return get('/market/payments/status', params);
};

/**
 * 模拟支付成功
 * POST /market/payments/mock-success
 */
const mockPaymentSuccess = (data) => {
  return post('/market/payments/mock-success', data);
};

module.exports = {
  applyMarketMerchant,
  searchMarket,
  getShopList,
  getShopDetail,
  getShopGoods,
  getGoodsDetail,
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
  previewOrder,
  createOrder,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  createPayment,
  getPaymentStatus,
  mockPaymentSuccess
};
