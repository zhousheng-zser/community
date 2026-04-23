/**
 * 邻里帮帮模块 API
 * 对应后端文档：五、邻里帮帮模块
 */
const { get, post } = require('../util.js');

/**
 * 创建帮帮订单
 * POST /neighbor-assist
 */
const createAssistOrder = (data) => {
  return post('/neighbor-assist', data);
};

/**
 * 获取我的帮帮订单
 * GET /neighbor-assist/my
 */
const getMyAssistOrders = (params) => {
  return get('/neighbor-assist/my', params);
};

/**
 * 获取待接单池
 * GET /neighbor-assist/pool
 */
const getAssistPool = (params) => {
  return get('/neighbor-assist/pool', params);
};

/**
 * 抢单
 * POST /neighbor-assist/:id/grab
 */
const grabAssistOrder = (id) => {
  return post(`/neighbor-assist/${id}/grab`);
};

/**
 * 完成订单
 * POST /neighbor-assist/:id/complete
 */
const completeAssistOrder = (id) => {
  return post(`/neighbor-assist/${id}/complete`);
};

module.exports = {
  createAssistOrder,
  getMyAssistOrders,
  getAssistPool,
  grabAssistOrder,
  completeAssistOrder
};
