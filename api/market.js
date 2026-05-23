/**
 * 本地集市模块 API（用户端）
 * 对应后端文档：六、本地集市模块
 */
const { get, post, put, del } = require('../utils/util.js');

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
 * 购物车数量汇总
 * GET /market/cart/summary
 */
const getCartSummary = () => {
  return get('/market/cart/summary');
};

/**
 * 获取购物车 (shop_id 可选，不传则返回全店分组)
 * GET /market/cart?shop_id=xxx
 */
const getCart = (shopId) => {
  return get('/market/cart', shopId ? { shop_id: shopId } : null);
};

/**
 * 添加购物车 (需传 shop_id + goods_id + quantity)
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
const clearCart = (shopId) => {
  return del('/market/cart', shopId ? { shop_id: shopId } : null);
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

/** 配送进度 GET /market/orders/:orderNo/delivery/track */
const getDeliveryTrack = (orderNo) => get(`/market/orders/${orderNo}/delivery/track`);

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

/**
 * 确认收货
 * POST /market/orders/:orderNo/confirm-receipt
 */
const confirmReceipt = (orderNo) => {
  return post(`/market/orders/${orderNo}/confirm-receipt`);
};

/**
 * 申请退款
 * POST /market/orders/:orderNo/refund
 */
const applyRefund = (orderNo, data) => {
  let no = orderNo;
  let body = data;
  if (orderNo && typeof orderNo === 'object') {
    body = orderNo;
    no = body.order_no || body.orderNo || '';
  }
  no = String(no || '').trim();
  if (!no) return Promise.reject({ errmsg: '订单号无效' });
  return post(`/market/orders/${encodeURIComponent(no)}/refund`, body || {});
};

/**
 * 获取退款详情
 * GET /market/orders/:orderNo/refund
 */
const getRefundDetail = (orderNo) => {
  return get(`/market/orders/${orderNo}/refund`);
};

/**
 * 取消退款申请
 * POST /market/orders/:orderNo/refund/cancel
 */
const cancelRefund = (orderNo) => {
  return post(`/market/orders/${orderNo}/refund/cancel`);
};

/**
 * 删除订单
 * DELETE /market/orders/:orderNo
 */
const deleteOrder = (orderNo) => {
  return del(`/market/orders/${orderNo}`);
};

/**
 * 再次购买
 * POST /market/orders/:orderNo/buy-again
 */
const buyAgain = (orderNo) => {
  return post(`/market/orders/${orderNo}/buy-again`);
};

/**
 * 联系商家
 * GET /market/shops/:shopId/contact
 */
const getShopContact = (shopId) => {
  return get(`/market/shops/${shopId}/contact`);
};

/**
 * 查看物流
 * GET /market/orders/:orderNo/logistics
 */
const getOrderLogistics = (orderNo) => {
  return get(`/market/orders/${orderNo}/logistics`);
};

module.exports = {
  applyMarketMerchant,
  searchMarket,
  getShopList,
  getShopDetail,
  getShopGoods,
  getGoodsDetail,
  getCartSummary,
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
  mockPaymentSuccess,
  confirmReceipt,
  applyRefund,
  getRefundDetail,
  cancelRefund,
  deleteOrder,
  buyAgain,
  getShopContact,
  getOrderLogistics,
  getDeliveryTrack
};
