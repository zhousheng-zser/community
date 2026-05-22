/**
 * 合伙人模块 API
 * 对应后端：/partner
 */
const { get, post } = require('../utils/util.js');

/**
 * 获取当前用户合伙人信息
 * GET /partner/me
 */
const getMyPartnerInfo = () => {
  return get('/partner/me');
};

/**
 * 获取合伙人申请状态
 * GET /partner/application/me
 */
const getApplicationMe = () => {
  return get('/partner/application/me');
};

/**
 * 获取我的下线列表
 * GET /partner/my-downlines
 */
const getMyDownlines = (params) => {
  return get('/partner/my-downlines', params);
};

/**
 * 申请合伙人角色
 * POST /partner/apply
 */
const applyPartner = (data) => {
  return post('/partner/apply', data);
};

/**
 * 刷新合伙人链
 * POST /partner/refresh-chain
 */
const refreshChain = () => {
  return post('/partner/refresh-chain', {});
};

module.exports = {
  getMyPartnerInfo,
  getApplicationMe,
  getMyDownlines,
  applyPartner,
  refreshChain
};
