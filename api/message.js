/**
 * 消息模块 API
 * 对应后端文档：十一、消息模块
 */
const { get, post } = require('../util.js');

/**
 * 获取会话列表
 * GET /messages/conversations
 */
const getConversations = (params) => {
  return get('/messages/conversations', params);
};

/**
 * 获取会话消息
 * GET /messages/conversations/:id
 */
const getConversationMessages = (id, params) => {
  return get(`/messages/conversations/${id}`, params);
};

/**
 * 发送消息
 * POST /messages/conversations/:id
 */
const sendMessage = (id, data) => {
  return post(`/messages/conversations/${id}`, data);
};

/**
 * 创建会话
 * POST /messages/conversations
 */
const createConversation = (data) => {
  return post('/messages/conversations', data);
};

module.exports = {
  getConversations,
  getConversationMessages,
  sendMessage,
  createConversation
};
