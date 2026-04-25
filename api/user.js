/**
 * 用户模块 API
 * 对应后端文档：二、用户模块
 */
const { get, post, patch, put, del } = require('../utils/util.js');

/**
 * 获取用户信息
 * GET /user/profile
 */
const getUserProfile = () => {
  return get('/user/profile');
};

/**
 * 更新用户信息
 * POST /user/profile (后端使用POST因为可能包含文件上传)
 */
const updateUserProfile = (data) => {
  return post('/user/profile', data);
};

/**
 * 获取用户地址列表
 * GET /user/addresses
 */
const getAddressList = () => {
  return get('/user/addresses');
};

/**
 * 添加用户地址
 * POST /user/addresses
 */
const addAddress = (data) => {
  return post('/user/addresses', data);
};

/**
 * 更新用户地址
 * PUT /user/addresses/:id
 */
const updateAddress = (id, data) => {
  return put(`/user/addresses/${id}`, data);
};

/**
 * 删除用户地址
 * DELETE /user/addresses/:id
 */
const deleteAddress = (id) => {
  return del(`/user/addresses/${id}`);
};

/**
 * 获取或生成邀请码 GET /user/invite-code
 */
const getInviteCode = () => {
  return get('/user/invite-code');
};

/**
 * 绑定邀请人 POST /user/bind-inviter
 */
const bindInviter = (inviteCode) => {
  return post('/user/bind-inviter', { invite_code: inviteCode });
};

/**
 * 查询邀请列表 GET /user/invitees
 */
const getInvitees = (params) => {
  return get('/user/invitees', params);
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAddressList,
  addAddress,
  updateAddress,
  deleteAddress,
  getInviteCode,
  bindInviter,
  getInvitees
};
