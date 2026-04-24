/**
 * 优惠券模块 API
 * 对应后端文档：优惠券相关接口
 */
const { get, post } = require('../utils/util.js');

/**
 * 获取可领取优惠券列表
 * GET /coupons/list
 */
const getCouponList = (params) => {
  return get('/coupons/list', params);
};

/**
 * 领取优惠券
 * POST /coupons/receive
 */
const receiveCoupon = (data) => {
  return post('/coupons/receive', data);
};

/**
 * 获取我的优惠券列表
 * GET /coupons/my
 */
const getMyCoupons = (params) => {
  return get('/coupons/my', params);
};

/**
 * 获取优惠券详情
 * GET /coupons/:couponId
 */
const getCouponDetail = (couponId) => {
  return get(`/coupons/${couponId}`);
};

/**
 * 获取订单可用优惠券
 * GET /coupons/available-for-order
 */
const getAvailableCouponsForOrder = (params) => {
  return get('/coupons/available-for-order', params);
};

module.exports = {
  getCouponList,
  receiveCoupon,
  getMyCoupons,
  getCouponDetail,
  getAvailableCouponsForOrder
};
