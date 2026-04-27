/**
 * 订单聊天模块 API
 * 用于订单服务相关的聊天消息
 *
 * TODO: 后端 /chat 路由下尚未实现订单聊天子路由，当前接口为预留设计。
 */
const { get, post } = require('../utils/util.js');

/**
 * 获取订单聊天列表
 * GET /chat/order/:orderId
 */
const getOrderChatList = (orderId) => {
    return get(`/chat/order/${orderId}`);
};

/**
 * 发送订单聊天消息
 * POST /chat/order/:orderId
 */
const sendOrderChatMessage = (orderId, data) => {
    return post(`/chat/order/${orderId}`, data);
};

/**
 * 获取订单聊天消息历史
 * POST /chat/order/:orderId/messages
 */
const getChatMessages = (orderId, data) => {
    return post(`/chat/order/${orderId}/messages`, data);
};

/**
 * 订单完成后自动建立聊天群
 * POST /chat/order/:orderId
 */
const createOrderChat = (orderId) => {
    return post(`/chat/order/${orderId}`, {
        type: 'order',
        order_id: orderId,
    });
};

module.exports = {
    getOrderChatList,
    sendOrderChatMessage,
    getChatMessages,
    createOrderChat
};
