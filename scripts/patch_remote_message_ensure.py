#!/usr/bin/env python3
from pathlib import Path

ctrl = Path('/home/cw/a/community-backend/backend/src/controllers/messageController.js')
routes = Path('/home/cw/a/community-backend/backend/src/routes/messageRoutes.js')

ctrl_text = ctrl.read_text(encoding='utf-8', errors='ignore')
routes_text = routes.read_text(encoding='utf-8', errors='ignore')

if 'exports.ensureOrderConversation' not in ctrl_text:
    ctrl_text += r"""

// 订单会话确保（商家<->买家 / 商家<->骑手 / 服务商<->用户 等）
exports.ensureOrderConversation = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const me = req.user && req.user.id ? Number(req.user.id) : 0;
        if (!me) {
            await t.rollback();
            return res.status(401).json({ errcode: 401, errmsg: '未登录' });
        }

        const body = req.body || {};
        const channel = String(body.channel || 'shop_buyer');
        const orderNo = String(body.order_no || '').trim();
        const shopId = Number(body.shop_id || 0);
        let buyerUserId = Number(body.buyer_user_id || body.customer_user_id || 0);
        let peerId = 0;

        if (channel === 'shop_buyer') {
            if (!shopId) {
                await t.rollback();
                return res.status(400).json({ errcode: 400, errmsg: '缺少 shop_id' });
            }
            if ((!buyerUserId || buyerUserId <= 0) && orderNo) {
                try:
                    const rows = await sequelize.query(
                        'SELECT user_id FROM market_orders WHERE order_no = :orderNo AND shop_id = :shopId LIMIT 1',
                        { replacements: { orderNo: orderNo, shopId: shopId } }
                    );
                    const arr = (rows && rows[0]) || [];
                    if (arr.length > 0 && arr[0].user_id != null) buyerUserId = Number(arr[0].user_id);
                } catch (e) {}
            }
            if (!buyerUserId || buyerUserId <= 0) buyerUserId = me;
            peerId = (me === buyerUserId) ? shopId : buyerUserId;
        } else if (channel === 'shop_rider') {
            peerId = Number(body.rider_user_id || 0);
        } else if (channel === 'merchant_customer') {
            peerId = Number(body.merchant_user_id || 0);
        } else if (channel === 'worker_customer') {
            peerId = Number(body.worker_user_id || 0);
        }

        if (!peerId) {
            await t.rollback();
            return res.status(400).json({ errcode: 400, errmsg: '缺少会话对端' });
        }

        let mapping = await UserConversation.findOne({
            where: { user_id: me, peer_id: peerId, bot_type: channel },
            transaction: t
        });
        let conversationId = mapping && mapping.conversation_id;

        if (!conversationId) {
            const conv = await Conversation.create({
                type: 'private',
                last_message_preview: orderNo ? `订单沟通 ${orderNo}` : '订单沟通'
            }, { transaction: t });
            conversationId = conv.id;
            await UserConversation.create({
                user_id: me,
                conversation_id: conversationId,
                peer_id: peerId,
                bot_type: channel,
                unread_count: 0,
                is_deleted: false
            }, { transaction: t });

            const reverse = await UserConversation.findOne({
                where: { user_id: peerId, peer_id: me, bot_type: channel },
                transaction: t
            });
            if (!reverse) {
                await UserConversation.create({
                    user_id: peerId,
                    conversation_id: conversationId,
                    peer_id: me,
                    bot_type: channel,
                    unread_count: 0,
                    is_deleted: false
                }, { transaction: t });
            } else {
                await reverse.update({ conversation_id: conversationId, is_deleted: false }, { transaction: t });
            }
        } else {
            await UserConversation.update(
                { is_deleted: false },
                { where: { user_id: me, conversation_id: conversationId }, transaction: t }
            );
        }

        await t.commit();
        return res.json({
            errcode: 0,
            data: { conversation_id: conversationId, channel: channel, order_no: orderNo }
        });
    } catch (error) {
        await t.rollback();
        console.error('ensureOrderConversation Error:', error);
        return res.status(500).json({ errcode: 500, errmsg: '建立会话失败' });
    }
};
"""

if "router.post('/order-conversation/ensure'" not in routes_text:
    routes_text = routes_text.replace(
        "// 管理员系统广播 (比如：\"活动优惠\"、\"交易物流\")",
        "router.post('/order-conversation/ensure', messageController.ensureOrderConversation);\n\n// 管理员系统广播 (比如：\"活动优惠\"、\"交易物流\")"
    )

ctrl.write_text(ctrl_text, encoding='utf-8')
routes.write_text(routes_text, encoding='utf-8')
print('patched remote message ensure route/controller')
