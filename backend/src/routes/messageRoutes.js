const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');

// 除了纯粹的服务器内部广播接口，其他一切涉及聊天和列表的都要 auth
router.use(authMiddleware);

// --- 淘宝式消息列表与历史 ---
// 获取我的聊天会话列表
router.get('/conversations', messageController.getConversations);

// 获取某个具体会话里的全部聊天历史
router.get('/history/:conversationId', messageController.getHistory);

// 在列表上左滑删除（隐藏）某个商铺或个人的聊天会话
router.delete('/conversations/:conversationId', messageController.deleteConversationList);

// --- 消息发送 ---
// 给某个人发送私聊消息 (自动新建房间或唤起原有隐藏房间)
router.post('/send', messageController.sendMessage);

// 管理员系统广播 (比如："活动优惠"、"交易物流")
// 真实场景下应单独建 adminMiddleware 保护，这里为了测试先行放入通用路由
router.post('/broadcast', messageController.broadcastSystemMessage);

module.exports = router;
