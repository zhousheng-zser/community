/**
 * 订单模块 API
 * 统一获取用户所有类型的订单（服务订单 / 集市订单 / 邻里帮帮）
 *
 * TODO: 后端尚未实现 /order/* 统一路由，当前仅作接口预留。
 *       如需获取服务订单，请使用 api.serviceOrder.getMyList()。
 */
const { get, post } = require('../utils/util.js');

/**
 * 获取用户所有订单
 * POST /order/all
 * { userFlag: 0|1, id: userId }
 *
 * 注意：后端当前未挂载 /order 路由，调用会返回 404。
 */
const getAll = (params) => {
  return post('/order/all', params);
};

/**
 * 获取用户订单列表（按类型）
 */
const getMyOrders = (type, params) => {
  return get('/order/my', { ...params, type });
};

/**
 * 获取订单详情
 */
const getOrderDetail = (id, type) => {
  return get(`/order/${id}`, { type });
};

/**
 * 取消订单
 */
const cancelOrder = (id) => {
  return post('/order/' + id + '/cancel');
};

module.exports = {
  getAll,
  getMyOrders,
  getOrderDetail,
  cancelOrder
};
