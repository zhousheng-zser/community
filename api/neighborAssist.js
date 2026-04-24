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
 * 获取待接单池
 * GET /neighbor-assist/orders/pool
 */
const getAssistPool = (params) => {
  return get('/neighbor-assist/orders/pool', params);
};

/**
 * 抢单
 * POST /neighbor-assist/orders/:id/grab
 */
const grabAssistOrder = (id) => {
  return post(`/neighbor-assist/orders/${id}/grab`);
};

/**
 * 完成订单
 * POST /neighbor-assist/orders/:id/complete
 */
const completeAssistOrder = (id) => {
  return post(`/neighbor-assist/orders/${id}/complete`);
};

module.exports = {
  createAssistOrder,
  getMyAssistOrders,
  getAssistPool,
  grabAssistOrder,
  completeAssistOrder
};
