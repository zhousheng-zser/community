/**
 * 消息模块 API
 * 对应后端文档：十一、消息模块
 */
const { get, post, del } = require('../utils/util.js');

/**
 * 获取会话列表
 * GET /messages/conversations
 */
const getConversations = (params) => {
  return get('/messages/conversations', params);
};

/**
 * 获取会话消息历史
 * GET /messages/history/:conversationId
 */
const getConversationMessages = (conversationId, params) => {
  return get(`/messages/history/${conversationId}`, params);
};

/**
 * 删除(隐藏)会话
 * DELETE /messages/conversations/:conversationId
 */
const deleteConversation = (conversationId) => {
  return del(`/messages/conversations/${conversationId}`);
};

/**
 * 发送私聊消息 (后端参数: peerId, content, msgType)
 * POST /messages/send
 */
const sendMessage = (data) => {
  return post('/messages/send', data);
};

/**
 * 发送系统广播消息
 * POST /messages/broadcast
 */
const broadcastMessage = (data) => {
  return post('/messages/broadcast', data);
};

module.exports = {
  getConversations,
  getConversationMessages,
  deleteConversation,
  sendMessage,
  broadcastMessage
};
