const { Conversation, UserConversation, Message, User, NeighborAssistOrder, sequelize } = require('../models');

// 获取当前用户的消息列表 (Taobao-style Chat List)
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        // 查找属于当前用户的且未被左滑删除的所有会话映射
        const userConvs = await UserConversation.findAll({
            where: {
                user_id: userId,
                is_deleted: false
            },
            include: [
                {
                    model: Conversation,
                    as: 'conversation'
                },
                {
                    model: User,
                    as: 'peerUser',
                    attributes: ['id', 'nickname', 'avatar_url'] // 只返回对方基本信息
                }
            ],
            // 按照会话的 updated_at 倒序排列（即最新消息排在最前面）
            order: [[{ model: Conversation, as: 'conversation' }, 'updated_at', 'DESC']]
        });

        res.json({ errcode: 0, data: userConvs });
    } catch (error) {
        console.error('getConversations Error:', error);
        res.status(500).json({ error: '无法获取消息列表' });
    }
};

// 获取具体某个会话的历史消息记录
exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;

        // 获取该会话下的所有历史消息（真实场景需要分页支持 limited/offset）
        const messages = await Message.findAll({
            where: { conversation_id: conversationId },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'nickname', 'avatar_url']
                }
            ],
            order: [['created_at', 'ASC']] // 最老的在上面，最新的在下面，符合聊天直觉
        });

        // 用户点进去看了历史消息后，需要把这个会话的未读数字清空为 0
        await UserConversation.update(
            { unread_count: 0 },
            { where: { user_id: userId, conversation_id: conversationId } }
        );

        res.json({ errcode: 0, data: messages });
    } catch (error) {
        console.error('getHistory Error:', error);
        res.status(500).json({ error: '无法获取历史消息' });
    }
};

// 发送私信 (给别人发一条消息，如果之前没聊过自动创建房间)
exports.sendMessage = async (req, res) => {
    // 采用事务包裹：必须同时插入 Message，并更新双方的 UserConversation 和总 Conversation
    const t = await sequelize.transaction();
    try {
        const senderId = req.user.id;
        const { peerId, content, msgType = 'text' } = req.body;

        if (peerId == null || !content) {
            return res.status(400).json({ error: '必须提供接收方 ID 和内容' });
        }

        const isSelfMessage = parseInt(senderId) === parseInt(peerId);

        // 1. 查找双方是否已经有过会话映射
        let senderMapping = await UserConversation.findOne({
            where: { user_id: senderId, peer_id: peerId }
        });

        let conversationId;

        if (!senderMapping) {
            // 如果发件人这没有映射，说明是第一次新建完整会话
            const newConv = await Conversation.create({ type: 'private', last_message_preview: content }, { transaction: t });
            conversationId = newConv.id;

            // 给发送者建立映射 (发的人自己未读数为 0)
            await UserConversation.create({
                user_id: senderId, conversation_id: conversationId, peer_id: peerId, unread_count: 0, is_deleted: false
            }, { transaction: t });

            if (!isSelfMessage) {
                // 给接收者建立映射 
                await UserConversation.create({
                    user_id: peerId, conversation_id: conversationId, peer_id: senderId, unread_count: 0, is_deleted: false
                }, { transaction: t });
            }

        } else {
            // 如果已经存在过聊天记录，直接更新现有会话时间并捞出 ID
            conversationId = senderMapping.conversation_id;
            await Conversation.update(
                { last_message_preview: content, updated_at: new Date() },
                { where: { id: conversationId }, transaction: t }
            );
        }

        // 2. 写入消息历史实体
        const newMessage = await Message.create({
            conversation_id: conversationId, sender_id: senderId, msg_type: msgType, content: content
        }, { transaction: t });

        // 3. 找到接收方的 UserConversation 映射，增加未读数，并且强制取消隐藏(即便是被左滑删除了也要弹出来)
        if (!isSelfMessage) {
            await UserConversation.increment('unread_count', {
                by: 1,
                where: { user_id: peerId, conversation_id: conversationId },
                transaction: t
            });
            await UserConversation.update(
                { is_deleted: false }, // 把处于软删除状态的会话重新弹出
                { where: { user_id: peerId, conversation_id: conversationId }, transaction: t }
            );
        }

        // 发送方自己如果以前软删除了这个对方框，只要一发消息也得弹出来
        await UserConversation.update(
            { is_deleted: false },
            { where: { user_id: senderId, conversation_id: conversationId }, transaction: t }
        );

        await t.commit();
        res.json({ errcode: 0, message: '发送成功', data: newMessage });

    } catch (error) {
        await t.rollback();
        console.error('sendMessage Error:', error);
        res.status(500).json({ error: '消息发送失败' });
    }
};

// 后台管理员广播活动广告 / 系统消息 (Taobao "活动优惠" 会话形态)
exports.broadcastSystemMessage = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { botType = 'event', content, msgType = 'text' } = req.body;
        // 比如 botType 可以是 'event' (活动通知), 'logistics' (交易物流), 'service' (服务端)

        // 1. 查找或创建专属的全局 System Conversation
        let systemConv = await Conversation.findOne({ where: { type: 'system', id: -1 } });
        // 为了方便区分不同种类的系统号（活动、物流），我们可以给每种类型分配一个伪造的负数ID作为房号
        // 但这里我们动态简化：先建一个真实 ID 的 Conversation，打上标志

        let targetConvId;
        // 在真实项目中应该有个常量表区分不同bot对应的会话ID。这里我们直接为特定botType查找已存在的第一个。
        // 此处简单起见，每次群发不一定同一个房，最好由上层业务逻辑传入或者约定特定房间号。
        // 简化版本：假设直接发。

        const newConv = await Conversation.create({
            type: 'system', last_message_preview: content
        }, { transaction: t });
        targetConvId = newConv.id;

        // 2. 获取所有用户的 ID 群发
        // (在实际淘宝几十亿用户体量中是使用消息队列分推或即时懒加载，这里直接全部循环/批量插入)
        const allUsers = await User.findAll({ attributes: ['id'] });

        let userConvMappings = [];
        let increments = [];

        for (const user of allUsers) {
            // 给每个用户建立到这个系统房号的连接。真实系统可能只存在唯一的一个“活动优惠”房间。
            // 这里为了演示结构，假设全量推送一个新的并立即标记未读。
            await UserConversation.findOrCreate({
                where: { user_id: user.id, peer_id: 0, bot_type: botType },
                defaults: { conversation_id: targetConvId, unread_count: 0, is_deleted: false },
                transaction: t
            });
            // 增加未读并显示出来
            await UserConversation.update({
                is_deleted: false
            }, { where: { user_id: user.id, bot_type: botType }, transaction: t });
            await UserConversation.increment('unread_count', {
                by: 1, where: { user_id: user.id, bot_type: botType }, transaction: t
            });
        }

        // 3. 只插入一条真正的系统信息。所有人的 UserConversation 都连接到这个共同的房间，节省存储。
        const systemMsg = await Message.create({
            conversation_id: targetConvId, sender_id: 0, msg_type: msgType, content: content
        }, { transaction: t });

        await t.commit();
        res.json({ errcode: 0, message: '系统广播成功', sent_users: allUsers.length });
    } catch (error) {
        await t.rollback();
        console.error('broadcastSystemMessage Error:', error);
        res.status(500).json({ error: '广播发送失败' });
    }
};

// 在消息列表左滑删除一个会话（软删除）
exports.deleteConversationList = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;

        await UserConversation.update(
            { is_deleted: true, unread_count: 0 },
            { where: { user_id: userId, conversation_id: conversationId } }
        );

        res.json({ errcode: 0, message: '会话已从列表中删除' });
    } catch (error) {
        console.error('deleteConversationList Error:', error);
        res.status(500).json({ error: '操作失败' });
    }
};


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
                try {
                    const rows = await sequelize.query(
                        'SELECT user_id FROM market_orders WHERE order_no = :orderNo AND shop_id = :shopId LIMIT 1',
                        { replacements: { orderNo: orderNo, shopId: shopId } }
                    );
                    const arr = (rows && rows[0]) || [];
                    if (arr.length > 0 && arr[0].user_id != null) buyerUserId = Number(arr[0].user_id);
                } catch (e) {}
            }
            if (!buyerUserId || buyerUserId <= 0) buyerUserId = me;
            if (me === buyerUserId) {
                // 商家侧点 联系买家时，必须对端是用户ID，不能是 shop_id
                let shopOwnerId = 0;
                try {
                    const shopRows = await sequelize.query(
                        'SELECT user_id FROM market_shops WHERE id = :shopId LIMIT 1',
                        { replacements: { shopId: shopId } }
                    );
                    const arr2 = (shopRows && shopRows[0]) || [];
                    if (arr2.length > 0 && arr2[0].user_id != null) shopOwnerId = Number(arr2[0].user_id);
                } catch (e) {}
                if (shopOwnerId > 0 && shopOwnerId !== buyerUserId) peerId = shopOwnerId;
                else peerId = buyerUserId;
            } else {
                peerId = buyerUserId;
            }
        } else if (channel === 'shop_rider') {
            peerId = Number(body.rider_user_id || 0);
        } else if (channel === 'merchant_customer') {
            peerId = Number(body.merchant_user_id || 0);
        } else if (channel === 'worker_customer') {
            peerId = Number(body.worker_user_id || 0);
        } else if (channel === 'neighbor_assist') {
            if (!NeighborAssistOrder) {
                await t.rollback();
                return res.status(503).json({ errcode: 503, errmsg: '邻里帮模块未加载' });
            }
            const orderIdNum = Number(body.order_id || 0);
            if (!orderIdNum) {
                await t.rollback();
                return res.status(400).json({ errcode: 400, errmsg: '缺少 order_id' });
            }
            const ordRow = await NeighborAssistOrder.findByPk(orderIdNum, { transaction: t });
            if (!ordRow) {
                await t.rollback();
                return res.status(404).json({ errcode: 404, errmsg: '订单不存在' });
            }
            const publisherId = Number(ordRow.user_id);
            const helperIdRaw = ordRow.assigned_worker_id != null ? Number(ordRow.assigned_worker_id) : 0;
            if (!helperIdRaw) {
                await t.rollback();
                return res.status(400).json({ errcode: 400, errmsg: '订单尚未指派邻居，暂时无法会话' });
            }
            if (me !== publisherId && me !== helperIdRaw) {
                await t.rollback();
                return res.status(403).json({ errcode: 403, errmsg: '无权参与该会话' });
            }
            peerId = me === publisherId ? helperIdRaw : publisherId;
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
