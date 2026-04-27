/**
 * 佣金模块 API
 * 对应后端：/commission
 */
const { get, post } = require('../utils/util.js');

/**
 * 获取佣金配置比例（公开接口）
 * GET /commission/config
 */
const getConfig = () => {
  return get('/commission/config');
};

/**
 * 获取当前用户佣金余额（汇总所有角色）
 * GET /commission/my
 */
const getMyBalance = () => {
  return get('/commission/my');
};

/**
 * 获取当前用户佣金明细记录
 * GET /commission/my/records
 */
const getMyRecords = (params) => {
  return get('/commission/my/records', params);
};

/**
 * 获取有佣金的订单列表
 * GET /commission/orders
 */
const getMyCommissionOrders = (params) => {
  return get('/commission/orders', params);
};

/**
 * 获取单笔订单的4方分佣明细
 * GET /commission/orders/:orderId/breakdown
 */
const getOrderBreakdown = (orderId) => {
  return get(`/commission/orders/${orderId}/breakdown`);
};

/**
 * 获取当前用户的合伙人链信息
 * GET /commission/partner-chain
 */
const getPartnerChain = () => {
  return get('/commission/partner-chain');
};

/**
 * 提现
 * POST /commission/withdraw
 */
const withdraw = (data) => {
  return post('/commission/withdraw', data);
};

module.exports = {
  getConfig,
  getMyBalance,
  getMyRecords,
  getMyCommissionOrders,
  getOrderBreakdown,
  getPartnerChain,
  withdraw
};
