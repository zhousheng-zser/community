const { Op } = require('sequelize');
const { Message, Conversation, UserConversation, User, ComplaintTicket } = require('../models');
const messageController = require('./messageController');

/**
 * GET /api/v1/admin/messages/overview
 * 站内消息与会话规模（运营监控）
 */
exports.overview = async (req, res) => {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalUsers, totalConversations, messages24h, messages7d, userConvCount, openComplaints] =
      await Promise.all([
        User.count(),
        Conversation.count(),
        Message.count({ where: { created_at: { [Op.gte]: since24h } } }),
        Message.count({ where: { created_at: { [Op.gte]: since7d } } }),
        UserConversation.count(),
        ComplaintTicket.count({
          where: { status: { [Op.in]: ['open', 'processing'] } }
        })
      ]);

    res.json({
      message: 'ok',
      data: {
        total_users: totalUsers,
        total_conversations: totalConversations,
        user_conversation_mappings: userConvCount,
        messages_last_24h: messages24h,
        messages_last_7d: messages7d,
        open_complaint_tickets: openComplaints
      }
    });
  } catch (e) {
    console.error('adminMessage overview', e);
    res.status(500).json({ error: '统计失败' });
  }
};

/**
 * POST /api/v1/admin/messages/broadcast
 * 向全体用户推送系统会话消息（复用 C 端广播逻辑，需管理员 JWT）
 */
exports.broadcast = (req, res) => messageController.broadcastSystemMessage(req, res);
