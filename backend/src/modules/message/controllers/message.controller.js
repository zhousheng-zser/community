const db = require('../../../models');
const { Conversation, UserConversation, Message, MarketOrder, sequelize } = db;

const ok = (res, data) => res.json({ errcode: 0, code: 0, msg: 'ok', data });
const fail = (res, msg, status = 400, code = 1) => res.status(status).json({ errcode: code, code, msg, errmsg: msg });
let messageTablesReady = false;

async function ensureMessageTables() {
  if (messageTablesReady) return;
  await Promise.all([
    Conversation && Conversation.sync ? Conversation.sync() : Promise.resolve(),
    UserConversation && UserConversation.sync ? UserConversation.sync() : Promise.resolve(),
    Message && Message.sync ? Message.sync() : Promise.resolve()
  ]);
  messageTablesReady = true;
}

function userId(req) {
  return req.user && req.user.id ? Number(req.user.id) : 0;
}

// GET /messages/conversations
exports.getConversations = async (req, res) => {
  try {
    await ensureMessageTables();
    const uid = userId(req);
    if (!uid) return fail(res, '未登录', 401, 401);
    const rows = await UserConversation.findAll({
      where: { user_id: uid, is_deleted: false },
      include: [{ model: Conversation, as: 'conversation', required: false }],
      order: [[{ model: Conversation, as: 'conversation' }, 'updated_at', 'DESC']]
    });
    ok(res, rows);
  } catch (e) {
    console.error('getConversations error', e);
    fail(res, '无法获取消息列表', 500, 500);
  }
};

// GET /messages/history/:conversationId
exports.getHistory = async (req, res) => {
  try {
    await ensureMessageTables();
    const uid = userId(req);
    if (!uid) return fail(res, '未登录', 401, 401);
    const conversationId = Number(req.params.conversationId);
    if (!conversationId) return fail(res, '无效会话ID');
    const uc = await UserConversation.findOne({ where: { user_id: uid, conversation_id: conversationId } });
    if (!uc) return fail(res, '无权访问该会话', 403, 403);
    const list = await Message.findAll({
      where: { conversation_id: conversationId },
      order: [['created_at', 'ASC']]
    });
    await UserConversation.update({ unread_count: 0 }, { where: { user_id: uid, conversation_id: conversationId } });
    ok(res, list);
  } catch (e) {
    console.error('getHistory error', e);
    fail(res, '无法获取历史消息', 500, 500);
  }
};

// DELETE /messages/conversations/:conversationId
exports.deleteConversation = async (req, res) => {
  try {
    await ensureMessageTables();
    const uid = userId(req);
    if (!uid) return fail(res, '未登录', 401, 401);
    const conversationId = Number(req.params.conversationId);
    if (!conversationId) return fail(res, '无效会话ID');
    await UserConversation.update(
      { is_deleted: true, unread_count: 0 },
      { where: { user_id: uid, conversation_id: conversationId } }
    );
    ok(res, { conversation_id: conversationId });
  } catch (e) {
    console.error('deleteConversation error', e);
    fail(res, '删除会话失败', 500, 500);
  }
};

// POST /messages/send
exports.sendMessage = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    await ensureMessageTables();
    const senderId = userId(req);
    if (!senderId) {
      await t.rollback();
      return fail(res, '未登录', 401, 401);
    }
    const peerId = Number(req.body && req.body.peerId);
    const content = String((req.body && req.body.content) || '').trim();
    const msgType = String((req.body && req.body.msgType) || 'text');
    if (!peerId || !content) {
      await t.rollback();
      return fail(res, '必须提供接收方 ID 和内容');
    }

    let senderUc = await UserConversation.findOne({
      where: { user_id: senderId, peer_id: peerId },
      transaction: t
    });
    let conversationId = senderUc && senderUc.conversation_id;
    if (!conversationId) {
      const conv = await Conversation.create({ type: 'private', last_message_preview: content }, { transaction: t });
      conversationId = conv.id;
      await UserConversation.create(
        { user_id: senderId, peer_id: peerId, conversation_id: conversationId, unread_count: 0, is_deleted: false },
        { transaction: t }
      );
      if (peerId !== senderId) {
        await UserConversation.create(
          { user_id: peerId, peer_id: senderId, conversation_id: conversationId, unread_count: 0, is_deleted: false },
          { transaction: t }
        );
      }
    } else {
      await Conversation.update(
        { last_message_preview: content, updated_at: new Date() },
        { where: { id: conversationId }, transaction: t }
      );
    }

    const msg = await Message.create(
      { conversation_id: conversationId, sender_id: senderId, msg_type: msgType, content },
      { transaction: t }
    );

    if (peerId !== senderId) {
      await UserConversation.increment('unread_count', {
        by: 1,
        where: { user_id: peerId, conversation_id: conversationId },
        transaction: t
      });
      await UserConversation.update(
        { is_deleted: false },
        { where: { user_id: peerId, conversation_id: conversationId }, transaction: t }
      );
    }
    await UserConversation.update(
      { is_deleted: false },
      { where: { user_id: senderId, conversation_id: conversationId }, transaction: t }
    );
    await t.commit();
    ok(res, msg);
  } catch (e) {
    await t.rollback();
    console.error('sendMessage error', e);
    fail(res, '消息发送失败', 500, 500);
  }
};

// POST /messages/order-conversation/ensure
exports.ensureOrderConversation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    await ensureMessageTables();
    const me = userId(req);
    if (!me) {
      await t.rollback();
      return fail(res, '未登录', 401, 401);
    }
    const body = req.body || {};
    const channel = String(body.channel || 'shop_buyer');
    const orderNo = String(body.order_no || '').trim();
    let buyerUserId = Number(body.buyer_user_id || body.customer_user_id || 0);
    let peer = 0;
    if (channel === 'shop_buyer') {
      const shopId = Number(body.shop_id || 0);
      if (!shopId) {
        await t.rollback();
        return fail(res, '缺少 shop_id');
      }
      // 兜底：若前端未传 buyer_user_id，则通过 order_no + shop_id 反查订单买家
      if ((!buyerUserId || buyerUserId <= 0) && orderNo && MarketOrder) {
        const ord = await MarketOrder.findOne({
          where: { order_no: orderNo, shop_id: shopId },
          attributes: ['user_id'],
          transaction: t
        });
        if (ord && ord.user_id != null) buyerUserId = Number(ord.user_id);
      }
      if (!buyerUserId || buyerUserId <= 0) {
        buyerUserId = me;
      }
      peer = me === buyerUserId ? shopId : buyerUserId;
    } else if (channel === 'shop_rider') {
      peer = Number(body.rider_user_id || 0);
    } else if (channel === 'merchant_customer') {
      peer = Number(body.customer_user_id || body.buyer_user_id || 0);
    } else if (channel === 'worker_customer') {
      peer = Number(body.customer_user_id || body.buyer_user_id || 0);
    }
    if (!peer) {
      await t.rollback();
      return fail(res, '缺少会话对端');
    }
    let uc = await UserConversation.findOne({ where: { user_id: me, peer_id: peer }, transaction: t });
    let conversationId = uc && uc.conversation_id;
    if (!conversationId) {
      const conv = await Conversation.create(
        { type: 'private', last_message_preview: orderNo ? `订单沟通 ${orderNo}` : '订单沟通' },
        { transaction: t }
      );
      conversationId = conv.id;
      await UserConversation.create(
        { user_id: me, peer_id: peer, conversation_id: conversationId, unread_count: 0, is_deleted: false, bot_type: channel },
        { transaction: t }
      );
      await UserConversation.findOrCreate({
        where: { user_id: peer, peer_id: me },
        defaults: { conversation_id: conversationId, unread_count: 0, is_deleted: false, bot_type: channel },
        transaction: t
      });
    } else {
      await UserConversation.update({ is_deleted: false }, { where: { user_id: me, conversation_id: conversationId }, transaction: t });
    }
    await t.commit();
    ok(res, { conversation_id: conversationId, channel, order_no: orderNo });
  } catch (e) {
    await t.rollback();
    console.error('ensureOrderConversation error', e);
    fail(res, '建立会话失败', 500, 500);
  }
};

// POST /messages/broadcast
exports.broadcast = async (req, res) => {
  try {
    const content = String((req.body && req.body.content) || '').trim();
    if (!content) return fail(res, '缺少 content');
    ok(res, { accepted: true, content });
  } catch (e) {
    console.error('broadcast error', e);
    fail(res, '广播失败', 500, 500);
  }
};
