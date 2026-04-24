/**
 * 家事币商城 API
 */
const { get, post } = require('../utils/util.js');

/**
 * 获取家事币余额
 * GET /benefit-coin/balance
 */
const getBalance = () => {
  return get('/benefit-coin/balance');
};

/**
 * 获取可兑换商品列表
 * GET /benefit-coin/goods
 */
const getExchangeGoods = (params) => {
  return get('/benefit-coin/goods', params);
};

/**
 * 获取兑换商品详情
 * GET /benefit-coin/goods/:goodsId
 */
const getExchangeGoodsDetail = (goodsId) => {
  return get(`/benefit-coin/goods/${goodsId}`);
};

/**
 * 兑换商品
 * POST /benefit-coin/exchange
 */
const exchangeGoods = (data) => {
  return post('/benefit-coin/exchange', data);
};

/**
 * 获取兑换记录
 * GET /benefit-coin/records
 */
const getExchangeRecords = (params) => {
  return get('/benefit-coin/records', params);
};

module.exports = {
  getBalance,
  getExchangeGoods,
  getExchangeGoodsDetail,
  exchangeGoods,
  getExchangeRecords
};
