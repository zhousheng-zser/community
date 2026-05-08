#!/usr/bin/env python3
"""
给 serviceProviderPortalController.js 打补丁：
1. 添加 Conversation/UserConversation/Message 引用
2. 添加 pushSpOrderNodeMessage（复用 merchant 的通知逻辑）
3. 修正 orderAccept: pending_accept -> paid_pending_dispatch
4. 新增 orderReject: 退款 + 通知
5. 新增 orderStartService: paid_pending_dispatch -> in_service
6. 完善 orderComplete: 支持 proof_images + 通知
7. 更新 orderAction map
"""
import os

TARGET = '/home/cw/a/community-backend/backend/src/controllers/serviceProviderPortalController.js'

with open(TARGET, 'r') as f:
    src = f.read()

# ── 1. 补充 models 引用 ─────────────────────────────────────────────────────
OLD_MODELS = """const {
  ServiceProviderPortalAccount,
  ServiceProviderProfile,
  Service,
  ServiceOrder,
  Category
} = require('../models');"""

NEW_MODELS = """const {
  ServiceProviderPortalAccount,
  ServiceProviderProfile,
  Service,
  ServiceOrder,
  Category,
  Conversation,
  UserConversation,
  Message
} = require('../models');
const { sequelize } = require('../models');"""

if 'Conversation,' not in src:
    src = src.replace(OLD_MODELS, NEW_MODELS)
    print("[OK] Added Conversation/UserConversation/Message imports")
else:
    print("[SKIP] Models already imported")

# ── 2. 在 loadProfileForPortal 前插入 pushSpOrderNodeMessage ────────────────
NOTIFY_FUNC = """
async function pushSpOrderNodeMessage(userId, orderNo, title, content) {
  const t = await sequelize.transaction();
  try {
    let mapping = await UserConversation.findOne({
      where: { user_id: userId, peer_id: userId, bot_type: 'logistics' },
      transaction: t
    });
    let conversationId = mapping && mapping.conversation_id;
    if (!conversationId) {
      const conv = await Conversation.create(
        { type: 'system', last_message_preview: content },
        { transaction: t }
      );
      conversationId = conv.id;
      mapping = await UserConversation.create({
        user_id: userId,
        conversation_id: conversationId,
        peer_id: userId,
        bot_type: 'logistics',
        unread_count: 0,
        is_deleted: false
      }, { transaction: t });
    }
    await Message.create({
      conversation_id: conversationId,
      sender_id: userId,
      msg_type: 'logistics',
      content: `${title}\\n订单号:${orderNo}\\n${content}`
    }, { transaction: t });
    await Conversation.update(
      { last_message_preview: content, updated_at: new Date() },
      { where: { id: conversationId }, transaction: t }
    );
    await UserConversation.update(
      { is_deleted: false },
      { where: { user_id: userId, conversation_id: conversationId }, transaction: t }
    );
    await UserConversation.increment('unread_count', {
      by: 1,
      where: { user_id: userId, conversation_id: conversationId },
      transaction: t
    });
    await t.commit();
  } catch (e) {
    await t.rollback();
    console.error('pushSpOrderNodeMessage error:', e && e.message);
  }
}

"""

ANCHOR = 'async function loadProfileForPortal(req) {'
if 'pushSpOrderNodeMessage' not in src:
    src = src.replace(ANCHOR, NOTIFY_FUNC + ANCHOR)
    print("[OK] Added pushSpOrderNodeMessage")
else:
    print("[SKIP] pushSpOrderNodeMessage already present")

# ── 3. 修正 orderAccept: in_service -> paid_pending_dispatch ────────────────
OLD_ACCEPT_STATUS = "    order.status = 'in_service';\n    await order.save();\n    return res.json({\n      errno: 0,\n      data: {\n        id: order.id,\n        status: order.status,\n        status_text: SERVICE_ORDER_STATUS_TEXT[order.status] || order.status\n      }\n    });\n  } catch (e) {\n    console.error('spPortal orderAccept', e);"

NEW_ACCEPT_STATUS = """    order.status = 'paid_pending_dispatch';
    await order.save();
    const buyerId = order.user_id || order.buyer_id;
    if (buyerId) {
      const orderNo = order.order_no || String(order.id);
      pushSpOrderNodeMessage(buyerId, orderNo, '服务商已接单', '服务商已接受您的服务订单，请耐心等待上门服务。').catch(() => {});
    }
    return res.json({
      errno: 0,
      data: { id: order.id, status: order.status, status_text: SERVICE_ORDER_STATUS_TEXT[order.status] || order.status }
    });
  } catch (e) {
    console.error('spPortal orderAccept', e);"""

if "order.status = 'paid_pending_dispatch'" not in src:
    src = src.replace(OLD_ACCEPT_STATUS, NEW_ACCEPT_STATUS)
    print("[OK] Fixed orderAccept status to paid_pending_dispatch")
else:
    print("[SKIP] orderAccept already updated")

# ── 4. 在 orderCheckIn 前插入 orderReject ───────────────────────────────────
REJECT_FUNC = """exports.orderReject = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const serviceIds = await getServiceIdsForProfile(profile.id);
    const id = parseInt(req.params.id, 10);
    const order = await findProviderOrderById(id, profile, serviceIds);
    if (!order) return res.status(404).json({ errno: 404, errmsg: '订单不存在' });
    if (order.status !== 'pending_accept') {
      return res.status(400).json({ errno: 400, errmsg: '当前状态不可拒单' });
    }
    order.status = 'cancelled';
    order.pay_status = 'refunded';
    await order.save();
    const buyerId = order.user_id || order.buyer_id;
    if (buyerId) {
      const orderNo = order.order_no || String(order.id);
      pushSpOrderNodeMessage(buyerId, orderNo, '服务商已拒单', '很抱歉，服务商无法接受此订单，系统将为您全额退款。').catch(() => {});
    }
    return res.json({
      errno: 0,
      data: { id: order.id, status: order.status, status_text: SERVICE_ORDER_STATUS_TEXT[order.status] || order.status }
    });
  } catch (e) {
    console.error('spPortal orderReject', e);
    return res.status(500).json({ errno: 500, errmsg: '操作失败' });
  }
};

"""

ORDER_CHECKIN_ANCHOR = 'exports.orderCheckIn = async (req, res) => {'
if 'exports.orderReject' not in src:
    src = src.replace(ORDER_CHECKIN_ANCHOR, REJECT_FUNC + ORDER_CHECKIN_ANCHOR)
    print("[OK] Added orderReject")
else:
    print("[SKIP] orderReject already present")

# ── 5. 在 orderEvidence 前插入 orderStartService ────────────────────────────
START_SERVICE_FUNC = """exports.orderStartService = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const serviceIds = await getServiceIdsForProfile(profile.id);
    const id = parseInt(req.params.id, 10);
    const order = await findProviderOrderById(id, profile, serviceIds);
    if (!order) return res.status(404).json({ errno: 404, errmsg: '订单不存在' });
    const allowedStates = ['paid_pending_dispatch', 'dispatched'];
    if (!allowedStates.includes(order.status)) {
      return res.status(400).json({ errno: 400, errmsg: '当前状态不可开始服务' });
    }
    order.status = 'in_service';
    await order.save();
    const buyerId = order.user_id || order.buyer_id;
    if (buyerId) {
      const orderNo = order.order_no || String(order.id);
      pushSpOrderNodeMessage(buyerId, orderNo, '服务商已到达', '服务人员已到达您的位置，正在为您提供服务。').catch(() => {});
    }
    return res.json({
      errno: 0,
      data: { id: order.id, status: order.status, status_text: SERVICE_ORDER_STATUS_TEXT[order.status] || order.status }
    });
  } catch (e) {
    console.error('spPortal orderStartService', e);
    return res.status(500).json({ errno: 500, errmsg: '操作失败' });
  }
};

"""

ORDER_EVIDENCE_ANCHOR = 'exports.orderEvidence = async (req, res) => {'
if 'exports.orderStartService' not in src:
    src = src.replace(ORDER_EVIDENCE_ANCHOR, START_SERVICE_FUNC + ORDER_EVIDENCE_ANCHOR)
    print("[OK] Added orderStartService")
else:
    print("[SKIP] orderStartService already present")

# ── 6. 完善 orderComplete: proof_images + 通知 ─────────────────────────────
OLD_COMPLETE = """    if (order.status !== 'in_service') return res.status(400).json({ errno: 400, errmsg: '当前状态不可完成服务' });
    const meta = { ...(order.fulfillment_meta || {}) };
    if (meta.await_user_confirm) {
      order.status = 'pending_user_confirm';
    } else {
      order.status = 'completed';
    }
    await order.save();
    return res.json({
      errno: 0,
      data: {
        id: order.id,
        status: order.status,
        status_text: SERVICE_ORDER_STATUS_TEXT[order.status] || order.status
      }
    });
  } catch (e) {
    console.error('spPortal orderComplete', e);"""

NEW_COMPLETE = """    if (order.status !== 'in_service') return res.status(400).json({ errno: 400, errmsg: '当前状态不可完成服务' });
    const meta = { ...(order.fulfillment_meta || {}) };
    // 保存上传的完工照片
    const proofImages = req.body && Array.isArray(req.body.proof_images) ? req.body.proof_images : [];
    if (proofImages.length) {
      meta.proof_images = proofImages;
    }
    // 统一进入 pending_user_confirm 等待用户确认
    order.status = 'pending_user_confirm';
    order.fulfillment_meta = meta;
    order.changed('fulfillment_meta', true);
    await order.save();
    const buyerId = order.user_id || order.buyer_id;
    if (buyerId) {
      const orderNo = order.order_no || String(order.id);
      pushSpOrderNodeMessage(buyerId, orderNo, '服务已完成，待您确认', '服务人员已完成服务，请在订单中点击"确认完成"以结单。').catch(() => {});
    }
    return res.json({
      errno: 0,
      data: { id: order.id, status: order.status, status_text: SERVICE_ORDER_STATUS_TEXT[order.status] || order.status }
    });
  } catch (e) {
    console.error('spPortal orderComplete', e);"""

if 'proof_images' not in src:
    src = src.replace(OLD_COMPLETE, NEW_COMPLETE)
    print("[OK] Enhanced orderComplete with proof_images + notification")
else:
    print("[SKIP] orderComplete already enhanced")

# ── 7. 更新 orderAction map ─────────────────────────────────────────────────
OLD_ACTION_MAP = "    const actionMap = { accept: exports.orderAccept, 'check-in': exports.orderCheckIn, checkin: exports.orderCheckIn, evidence: exports.orderEvidence, complete: exports.orderComplete };"
NEW_ACTION_MAP = "    const actionMap = { accept: exports.orderAccept, reject: exports.orderReject, 'check-in': exports.orderCheckIn, checkin: exports.orderCheckIn, 'start-service': exports.orderStartService, startservice: exports.orderStartService, evidence: exports.orderEvidence, complete: exports.orderComplete };"

if "'start-service'" not in src or 'reject' not in src:
    src = src.replace(OLD_ACTION_MAP, NEW_ACTION_MAP)
    print("[OK] Updated orderAction map")
else:
    print("[SKIP] actionMap already updated")

with open(TARGET, 'w') as f:
    f.write(src)

print("\n✅ SP controller patch complete!")
