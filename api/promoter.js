/**
 * 推客模块 API
 */
const { get, post } = require('../utils/util.js');

/**
 * 获取推客佣金信息
 * GET /promoter/commission
 */
const getCommission = () => {
  return get('/promoter/commission');
};

/**
 * 获取推客订单列表
 * GET /promoter/orders
 */
const getOrders = (params) => {
  return get('/promoter/orders', params);
};

/**
 * 获取推客收益明细
 * GET /promoter/income-records
 */
const getIncomeRecords = (params) => {
  return get('/promoter/income-records', params);
};

/**
 * 提现申请
 * POST /promoter/withdraw
 */
const withdraw = (data) => {
  return post('/promoter/withdraw', data);
};

/**
 * 获取推广链接
 * GET /promoter/share-link
 */
const getShareLink = (params) => {
  return get('/promoter/share-link', params);
};

module.exports = {
  getCommission,
  getOrders,
  getIncomeRecords,
  withdraw,
  getShareLink
};
