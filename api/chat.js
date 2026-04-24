/**
 * 聊天模块 API
 */
const { get, post } = require('../utils/util.js');

/**
 * 获取群列表
 * GET /chat/groups
 */
const getGroups = (params) => {
  return get('/chat/groups', params);
};

/**
 * 创建群聊
 * POST /chat/groups
 */
const createGroup = (data) => {
  return post('/chat/groups', data);
};

/**
 * 获取群详情
 * GET /chat/groups/:groupId
 */
const getGroupDetail = (groupId) => {
  return get(`/chat/groups/${groupId}`);
};

/**
 * 获取群成员列表
 * GET /chat/groups/:groupId/members
 */
const getGroupMembers = (groupId) => {
  return get(`/chat/groups/${groupId}/members`);
};

/**
 * 添加群成员
 * POST /chat/groups/:groupId/members
 */
const addGroupMembers = (groupId, data) => {
  return post(`/chat/groups/${groupId}/members`, data);
};

/**
 * 移除群成员
 * POST /chat/groups/:groupId/members/:userId/remove
 */
const removeGroupMember = (groupId, userId) => {
  return post(`/chat/groups/${groupId}/members/${userId}/remove`);
};

/**
 * 退出群聊
 * POST /chat/groups/:groupId/quit
 */
const quitGroup = (groupId) => {
  return post(`/chat/groups/${groupId}/quit`);
};

/**
 * 解散群聊
 * POST /chat/groups/:groupId/dismiss
 */
const dismissGroup = (groupId) => {
  return post(`/chat/groups/${groupId}/dismiss`);
};

/**
 * 获取群消息历史
 * GET /chat/groups/:groupId/messages
 */
const getGroupMessages = (groupId, params) => {
  return get(`/chat/groups/${groupId}/messages`, params);
};

/**
 * 发送群消息
 * POST /chat/groups/:groupId/messages
 */
const sendGroupMessage = (groupId, data) => {
  return post(`/chat/groups/${groupId}/messages`, data);
};

/**
 * 关注用户
 * POST /chat/follow/:userId
 */
const followUser = (userId) => {
  return post(`/chat/follow/${userId}`);
};

/**
 * 取关用户
 * POST /chat/unfollow/:userId
 */
const unfollowUser = (userId) => {
  return post(`/chat/unfollow/${userId}`);
};

module.exports = {
  getGroups,
  createGroup,
  getGroupDetail,
  getGroupMembers,
  addGroupMembers,
  removeGroupMember,
  quitGroup,
  dismissGroup,
  getGroupMessages,
  sendGroupMessage,
  followUser,
  unfollowUser
};
