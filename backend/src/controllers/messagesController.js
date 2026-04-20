const jwt = require('jsonwebtoken');
const store = require('../orderConversationStore');
const riderLoc = require('../riderLocationStore');

function ok(res, data) {
  res.json({ errno: 0, errmsg: 'ok', data });
}

function getUserIdFromReq(req) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const token = m[1];
  const decoded = jwt.decode(token);
  if (decoded) {
    if (decoded.id != null) return Number(decoded.id);
    if (decoded.userId != null) return Number(decoded.userId);
    if (decoded.user_id != null) return Number(decoded.user_id);
    if (decoded.sub != null && !Number.isNaN(Number(decoded.sub))) return Number(decoded.sub);
  }
  let h = 0;
  for (let i = 0; i < token.length; i++) h = ((h << 5) - h) + token.charCodeAt(i) | 0;
  return 1000000 + Math.abs(h % 899999);
}

function getShopIdQuery(req) {
  const q = req.query.shop_id != null ? req.query.shop_id : req.query.shopId;
  if (q == null || q === '') return null;
  const n = Number(q);
  return Number.isFinite(n) ? n : null;
}

function getRiderIdQuery(req) {
  const q = req.query.rider_id != null ? req.query.rider_id : req.query.riderId;
  if (q == null || q === '') return null;
  const n = Number(q);
  return Number.isFinite(n) ? n : null;
}

function formatConvItem(c, viewerUserId) {
  const uid = Number(viewerUserId);
  const ch = store.normChannel(c.channel);
  let title = `[订单] ${c.order_no}`;
  let peerUser = {
    nickname: '对方',
    avatar_url: '/img/other_services/platform_service.png'
  };
  let peerId = 0;

  if (ch === store.CHANNEL.SHOP_BUYER) {
    const isBuyer = c.buyer_user_id === uid;
    peerId = isBuyer ? 900000000 + Number(c.shop_id || 0) : c.buyer_user_id;
    title = `[订单] ${c.order_no} · 买卖家`;
    peerUser = isBuyer
      ? {
          nickname: c.shop_name || '商家',
          avatar_url: '/img/join_services/market_merchant.png'
        }
      : {
          nickname: c.buyer_name || '客户',
          avatar_url: '/img/my_orders/market_order.png'
        };
  } else if (ch === store.CHANNEL.SHOP_RIDER) {
    const isRider = c.rider_user_id === uid;
    peerId = isRider ? 900000000 + Number(c.shop_id || 0) : c.rider_user_id;
    title = `[订单] ${c.order_no} · 骑手`;
    peerUser = isRider
      ? {
          nickname: c.shop_name || '商家',
          avatar_url: '/img/join_services/market_merchant.png'
        }
      : {
          nickname: c.rider_name || '骑手',
          avatar_url: '/img/worker_avatars/1.png'
        };
  } else if (ch === store.CHANNEL.WORKER_CUSTOMER) {
    const isCustomer = c.buyer_user_id === uid;
    peerId = isCustomer ? c.worker_user_id : c.buyer_user_id;
    title = `[到家] ${c.order_no}`;
    peerUser = isCustomer
      ? {
          nickname: '技工',
          avatar_url: '/img/join_services/worker_join.png'
        }
      : {
          nickname: c.buyer_name || '客户',
          avatar_url: '/img/my_orders/service_order.png'
        };
  } else {
    const isBuyer = c.buyer_user_id === uid;
    peerId = isBuyer ? c.rider_user_id : c.buyer_user_id;
    title = `[订单] ${c.order_no} · 配送`;
    peerUser = isBuyer
      ? {
          nickname: c.rider_name || '骑手',
          avatar_url: '/img/worker_avatars/1.png'
        }
      : {
          nickname: c.buyer_name || '客户',
          avatar_url: '/img/my_orders/market_order.png'
        };
  }

  return {
    conversation_id: c.id,
    peer_id: peerId,
    peerUser,
    conversation: {
      updated_at: c.updated_at,
      last_message_preview: c.last_message_preview
    },
    unread_count: 0,
    order_no: c.order_no,
    channel: ch,
    scene: 'order_market',
    title
  };
}

exports.listConversations = (req, res) => {
  const userId = getUserIdFromReq(req);
  if (userId == null) {
    return res.status(401).json({ errno: 401, errmsg: '请先登录' });
  }
  const shopId = getShopIdQuery(req);
  const riderId = getRiderIdQuery(req);
  const list = store.listForUser(userId, shopId, riderId).map((c) => formatConvItem(c, userId));
  ok(res, list);
};

exports.getHistory = (req, res) => {
  const userId = getUserIdFromReq(req);
  if (userId == null) {
    return res.status(401).json({ errno: 401, errmsg: '请先登录' });
  }
  const conversationId = req.params.conversationId;
  const shopId = getShopIdQuery(req);
  const riderId = getRiderIdQuery(req);
  if (!store.canAccess(userId, shopId, riderId, conversationId)) {
    return res.status(403).json({ errno: 403, errmsg: '无权查看该会话' });
  }
  const rows = store.listMessages(conversationId).map((m) => ({
    id: m.id,
    sender_id: m.sender_id,
    msg_type: m.msg_type,
    content: m.content,
    created_at: m.created_at,
    sender:
      m.sender_id === 0
        ? { nickname: '系统', avatar_url: '/img/other_services/platform_service.png' }
        : null
  }));
  ok(res, rows);
};

exports.sendMessage = (req, res) => {
  const userId = getUserIdFromReq(req);
  if (userId == null) {
    return res.status(401).json({ errno: 401, errmsg: '请先登录' });
  }
  const b = req.body || {};
  const conversationId = b.conversationId || b.conversation_id;
  const shopForAcl =
    b.shop_id != null && b.shop_id !== ''
      ? b.shop_id
      : b.shopId != null && b.shopId !== ''
        ? b.shopId
        : getShopIdQuery(req);
  const riderForAcl =
    b.rider_id != null && b.rider_id !== ''
      ? b.rider_id
      : b.riderId != null && b.riderId !== ''
        ? b.riderId
        : getRiderIdQuery(req);
  if (!conversationId) {
    return res.status(400).json({ errno: 400, errmsg: '缺少 conversationId' });
  }
  if (!store.canAccess(userId, shopForAcl, riderForAcl, conversationId)) {
    return res.status(403).json({ errno: 403, errmsg: '无权在该会话发消息' });
  }
  const msgType = b.msgType || b.msg_type || 'text';
  const content = b.content;
  if (content == null || String(content).trim() === '') {
    return res.status(400).json({ errno: 400, errmsg: '消息内容不能为空' });
  }
  const row = store.addMessage(conversationId, userId, msgType === 'image' ? 'image' : 'text', content);
  ok(res, { message: row });
};

exports.ensureOrderConversation = (req, res) => {
  const userId = getUserIdFromReq(req);
  if (userId == null) {
    return res.status(401).json({ errno: 401, errmsg: '请先登录' });
  }
  const b = req.body || {};
  const orderNo = b.order_no || b.orderNo;
  const shopId = b.shop_id != null ? b.shop_id : b.shopId;
  const shopName = b.shop_name || b.shopName || '';
  const buyerName = b.buyer_name || b.buyerName || '';
  const riderName = b.rider_name || b.riderName || '';
  const channel = store.normChannel(b.channel);

  if (!orderNo) {
    return res.status(400).json({ errno: 400, errmsg: '缺少 order_no' });
  }

  let buyerUserId = b.buyer_user_id != null ? Number(b.buyer_user_id) : NaN;
  let riderUserId = b.rider_user_id != null ? Number(b.rider_user_id) : NaN;
  let workerUserIdForEnsure = 0;

  if (channel === store.CHANNEL.WORKER_CUSTOMER) {
    let w = b.worker_user_id != null ? Number(b.worker_user_id) : NaN;
    let cuid = b.customer_user_id != null ? Number(b.customer_user_id) : NaN;
    if (b.buyer_user_id != null && !Number.isFinite(cuid)) {
      cuid = Number(b.buyer_user_id);
    }
    if (!Number.isFinite(w) || w <= 0) {
      w = userId;
    }
    if (!Number.isFinite(cuid) || cuid <= 0) {
      cuid = userId;
    }
    if (w === cuid) {
      return res.status(400).json({ errno: 400, errmsg: '技工与客户的用户 ID 不能相同' });
    }
    buyerUserId = cuid;
    workerUserIdForEnsure = w;
  } else if (channel === store.CHANNEL.SHOP_BUYER) {
    if (!Number.isFinite(buyerUserId) || buyerUserId <= 0) {
      buyerUserId = userId;
    }
  } else if (channel === store.CHANNEL.SHOP_RIDER) {
    const hasShop = shopId != null && shopId !== '';
    if (hasShop) {
      if (!Number.isFinite(riderUserId) || riderUserId <= 0) {
        return res.status(400).json({ errno: 400, errmsg: '商家联系骑手时请传 rider_user_id' });
      }
    } else if (!Number.isFinite(riderUserId) || riderUserId <= 0) {
      riderUserId = userId;
    }
    if (!Number.isFinite(buyerUserId) || buyerUserId < 0) {
      buyerUserId = 0;
    }
  } else if (channel === store.CHANNEL.RIDER_BUYER) {
    if (!Number.isFinite(buyerUserId) || buyerUserId <= 0) {
      buyerUserId = userId;
    }
    if (!Number.isFinite(riderUserId) || riderUserId <= 0) {
      riderUserId = userId;
    }
  }

  const c = store.ensureConversation({
    orderNo: String(orderNo).trim(),
    channel,
    shopId: channel === store.CHANNEL.WORKER_CUSTOMER ? 0 : shopId,
    shopName,
    buyerUserId: Number.isFinite(buyerUserId) ? buyerUserId : 0,
    buyerName,
    riderUserId: Number.isFinite(riderUserId) ? riderUserId : 0,
    riderName,
    workerUserId: workerUserIdForEnsure
  });

  if (channel !== store.CHANNEL.WORKER_CUSTOMER) {
    riderLoc.registerOrderShop(String(orderNo).trim(), shopId);
  }

  ok(res, {
    conversation_id: c.id,
    order_no: c.order_no,
    shop_id: c.shop_id,
    channel: c.channel
  });
};

exports.deleteConversation = (req, res) => {
  const userId = getUserIdFromReq(req);
  if (userId == null) {
    return res.status(401).json({ errno: 401, errmsg: '请先登录' });
  }
  const conversationId = req.params.conversationId;
  const shopId = getShopIdQuery(req);
  const riderId = getRiderIdQuery(req);
  if (!store.canAccess(userId, shopId, riderId, conversationId)) {
    return res.status(403).json({ errno: 403, errmsg: '无权操作' });
  }
  store.softDeleteForUser(conversationId, userId);
  ok(res, { ok: true });
};

exports.uploadImage = (req, res) => {
  const userId = getUserIdFromReq(req);
  if (userId == null) {
    return res.status(401).json({ errno: 401, errmsg: '请先登录' });
  }
  if (!req.file || !req.file.filename) {
    return res.status(400).json({ errno: 400, errmsg: '未收到文件' });
  }
  const url = `/uploads/chat/${req.file.filename}`;
  ok(res, { url, path: url });
};

/** 商家/买家查看骑手实时位置（演示数据） */
exports.getRiderLocation = (req, res) => {
  const userId = getUserIdFromReq(req);
  if (userId == null) {
    return res.status(401).json({ errno: 401, errmsg: '请先登录' });
  }
  const orderNo = req.query.order_no || req.query.orderNo;
  const shopId = getShopIdQuery(req);
  if (!orderNo) {
    return res.status(400).json({ errno: 400, errmsg: '缺少 order_no' });
  }
  let row = riderLoc.getForOrder(orderNo);
  if (!row) {
    row = riderLoc.seedDemo(orderNo, shopId);
  }
  ok(res, row);
};
