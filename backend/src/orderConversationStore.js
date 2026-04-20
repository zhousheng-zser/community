/**
 * 订单绑定会话（内存演示）：支持
 * - shop_buyer：商家 ↔ 买家
 * - shop_rider：商家 ↔ 骑手
 * - rider_buyer：骑手 ↔ 买家（可选）
 * - worker_customer：技工 ↔ 客户（到家服务订单）
 */

const CHANNEL = {
  SHOP_BUYER: 'shop_buyer',
  SHOP_RIDER: 'shop_rider',
  RIDER_BUYER: 'rider_buyer',
  WORKER_CUSTOMER: 'worker_customer'
};

let conversations = [];
let messages = [];
let nextConvId = 1;
let nextMsgId = 1;

function nowIso() {
  return new Date().toISOString();
}

function normChannel(ch) {
  const c = String(ch || '').trim();
  if (
    c === CHANNEL.SHOP_RIDER ||
    c === CHANNEL.RIDER_BUYER ||
    c === CHANNEL.WORKER_CUSTOMER
  ) {
    return c;
  }
  return CHANNEL.SHOP_BUYER;
}

function findConv(orderNo, channel) {
  const on = String(orderNo || '').trim();
  const ch = normChannel(channel);
  return (
    conversations.find(
      (x) => x.order_no === on && normChannel(x.channel) === ch
    ) || null
  );
}

function ensureConversation(opts) {
  const orderNo = String(opts.orderNo || '').trim();
  if (!orderNo) return null;

  const channel = normChannel(opts.channel);
  let c = findConv(orderNo, channel);
  if (c) return c;

  const sid = Number(opts.shopId);
  const shop_id = Number.isFinite(sid) ? sid : 0;
  const bid = Number(opts.buyerUserId);
  const buyer_user_id = Number.isFinite(bid) ? bid : 0;
  const rid = Number(opts.riderUserId);
  const rider_user_id = Number.isFinite(rid) ? rid : 0;
  const wid = Number(opts.workerUserId);
  const worker_user_id = Number.isFinite(wid) ? wid : 0;

  c = {
    id: nextConvId++,
    order_no: orderNo,
    channel,
    shop_id,
    shop_name: opts.shopName || `店铺 #${shop_id || '—'}`,
    buyer_user_id,
    buyer_name: opts.buyerName || '买家',
    rider_user_id,
    rider_name: opts.riderName || '骑手',
    worker_user_id,
    last_message_preview: '会话已建立',
    updated_at: nowIso(),
    deleted_for: []
  };

  let sys = '';
  if (channel === CHANNEL.SHOP_BUYER) {
    c.last_message_preview = '订单会话已建立，可与商家沟通';
    sys = `[系统] 订单 ${orderNo} 已建立买卖家会话，可发文字或图片。`;
  } else if (channel === CHANNEL.SHOP_RIDER) {
    c.last_message_preview = '可与骑手沟通配送';
    sys = `[系统] 订单 ${orderNo} 已建立商家与骑手会话，用于取货、配送沟通。`;
  } else if (channel === CHANNEL.WORKER_CUSTOMER) {
    c.last_message_preview = '可与客户沟通上门与服务';
    sys = `[系统] 到家订单 ${orderNo} 已建立技工与客户的会话，可发送文字或图片。`;
  } else {
    c.last_message_preview = '可与骑手沟通';
    sys = `[系统] 订单 ${orderNo} 已建立买家与骑手会话。`;
  }

  conversations.push(c);
  addMessage(c.id, 0, 'text', sys);
  return c;
}

function addMessage(conversationId, senderId, msgType, content) {
  const m = {
    id: nextMsgId++,
    conversation_id: Number(conversationId),
    sender_id: senderId,
    msg_type: msgType,
    content: String(content || ''),
    created_at: nowIso()
  };
  messages.push(m);
  const c = conversations.find((x) => x.id === Number(conversationId));
  if (c) {
    c.last_message_preview = msgType === 'image' ? '[图片]' : m.content.slice(0, 80);
    c.updated_at = m.created_at;
  }
  return m;
}

function getByOrderNo(orderNo) {
  const on = String(orderNo || '').trim();
  return conversations.find((x) => x.order_no === on && normChannel(x.channel) === CHANNEL.SHOP_BUYER) || null;
}

function getConversation(id) {
  return conversations.find((x) => x.id === Number(id)) || null;
}

function listMessages(conversationId) {
  const cid = Number(conversationId);
  return messages
    .filter((m) => m.conversation_id === cid)
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
}

function canAccess(userId, shopIdFromQuery, riderIdFromQuery, conversationId) {
  const c = getConversation(conversationId);
  if (!c) return false;
  const uid = Number(userId);
  const ch = normChannel(c.channel);
  const sidRaw = shopIdFromQuery != null ? shopIdFromQuery : null;
  const sid = sidRaw != null && sidRaw !== '' ? Number(sidRaw) : null;
  const ridRaw = riderIdFromQuery != null ? riderIdFromQuery : null;
  const rid = ridRaw != null && ridRaw !== '' ? Number(ridRaw) : null;

  if (ch === CHANNEL.SHOP_BUYER) {
    if (c.buyer_user_id === uid) return true;
    if (sid != null && Number.isFinite(sid) && c.shop_id === sid) return true;
    return false;
  }
  if (ch === CHANNEL.SHOP_RIDER) {
    if (c.rider_user_id === uid) return true;
    if (sid != null && Number.isFinite(sid) && c.shop_id === sid) return true;
    return false;
  }
  if (ch === CHANNEL.RIDER_BUYER) {
    if (c.buyer_user_id === uid) return true;
    if (c.rider_user_id === uid) return true;
    if (rid != null && Number.isFinite(rid) && c.rider_user_id === rid) return true;
    return false;
  }
  if (ch === CHANNEL.WORKER_CUSTOMER) {
    if (c.buyer_user_id === uid) return true;
    if (c.worker_user_id === uid) return true;
    return false;
  }
  return false;
}

function listForUser(userId, shopIdFromQuery, riderIdFromQuery) {
  const uid = Number(userId);
  const sidRaw = shopIdFromQuery != null ? shopIdFromQuery : null;
  const sid = sidRaw != null && sidRaw !== '' ? Number(sidRaw) : null;
  const ridRaw = riderIdFromQuery != null ? riderIdFromQuery : null;
  const rid = ridRaw != null && ridRaw !== '' ? Number(ridRaw) : null;

  return conversations.filter((c) => {
    if (c.deleted_for && c.deleted_for.includes(uid)) return false;
    const ch = normChannel(c.channel);
    if (ch === CHANNEL.SHOP_BUYER) {
      if (c.buyer_user_id === uid) return true;
      if (sid != null && Number.isFinite(sid) && c.shop_id === sid) return true;
      return false;
    }
    if (ch === CHANNEL.SHOP_RIDER) {
      if (c.rider_user_id === uid) return true;
      if (sid != null && Number.isFinite(sid) && c.shop_id === sid) return true;
      return false;
    }
    if (ch === CHANNEL.RIDER_BUYER) {
      if (c.buyer_user_id === uid) return true;
      if (c.rider_user_id === uid) return true;
      if (rid != null && Number.isFinite(rid) && c.rider_user_id === rid) return true;
      return false;
    }
    if (ch === CHANNEL.WORKER_CUSTOMER) {
      if (c.buyer_user_id === uid) return true;
      if (c.worker_user_id === uid) return true;
      return false;
    }
    return false;
  });
}

function softDeleteForUser(conversationId, userId) {
  const c = getConversation(conversationId);
  if (!c) return false;
  const uid = Number(userId);
  if (!c.deleted_for) c.deleted_for = [];
  if (!c.deleted_for.includes(uid)) c.deleted_for.push(uid);
  return true;
}

module.exports = {
  CHANNEL,
  ensureConversation,
  addMessage,
  getByOrderNo,
  getConversation,
  listMessages,
  listForUser,
  canAccess,
  softDeleteForUser,
  normChannel
};
