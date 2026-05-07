const { ChatGroup, ChatGroupMember, ChatGroupMessage, User, UserFollow } = require('../../../models');

// ===== Group Management =====

// GET /chat/groups - Get groups user belongs to
exports.getGroups = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.page_size) || 50;
        const offset = (page - 1) * pageSize;

        const members = await ChatGroupMember.findAll({
            where: { user_id: userId },
            include: [{
                model: ChatGroup,
                as: 'group',
                where: { is_dismissed: 0 },
                required: true,
                include: [{
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'nickname', 'avatar_url']
                }]
            }],
            order: [['group', 'last_message_at', 'DESC']],
            limit: pageSize,
            offset
        });

        const total = await ChatGroupMember.count({
            where: { user_id: userId },
            include: [{ model: ChatGroup, as: 'group', where: { is_dismissed: 0 }, required: true }]
        });

        const groups = members.map(m => {
            const g = m.group;
            return {
                id: g.id,
                name: g.name,
                avatar: g.avatar_url || '',
                memberCount: g.member_count,
                lastMessage: g.last_message,
                lastMessageTime: g.last_message_at,
                creator: g.creator,
                role: m.role
            };
        });

        res.json({ code: 0, msg: 'ok', data: { list: groups, total, page, page_size: pageSize } });
    } catch (error) {
        console.error('获取群列表失败:', error);
        res.status(500).json({ code: 1, msg: '获取群列表失败' });
    }
};

// POST /chat/groups - Create group
exports.createGroup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, member_user_ids } = req.body;

        const group = await ChatGroup.create({
            name: name || '新群聊',
            creator_id: userId,
            member_count: 1
        });

        await ChatGroupMember.create({ group_id: group.id, user_id: userId, role: 'owner' });

        if (member_user_ids && Array.isArray(member_user_ids) && member_user_ids.length > 0) {
            const members = member_user_ids.filter(id => id !== userId).map(uid => ({
                group_id: group.id,
                user_id: uid,
                role: 'member'
            }));
            if (members.length > 0) {
                await ChatGroupMember.bulkCreate(members);
                await group.increment('member_count', { by: members.length });
            }
        }

        res.json({ code: 0, msg: '创建成功', data: { id: group.id, name: group.name } });
    } catch (error) {
        console.error('创建群聊失败:', error);
        res.status(500).json({ code: 1, msg: '创建群聊失败' });
    }
};

// GET /chat/groups/:groupId - Get group detail
exports.getGroupDetail = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const member = await ChatGroupMember.findOne({ where: { group_id: groupId, user_id: userId } });
        if (!member) return res.status(403).json({ code: 1, msg: '不是群成员' });

        const group = await ChatGroup.findByPk(groupId, {
            include: [{ model: User, as: 'creator', attributes: ['id', 'nickname', 'avatar_url'] }]
        });
        if (!group || group.is_dismissed) return res.status(404).json({ code: 1, msg: '群不存在' });

        res.json({ code: 0, msg: 'ok', data: {
            id: group.id, name: group.name, avatar: group.avatar_url || '',
            memberCount: group.member_count, creator: group.creator, role: member.role
        }});
    } catch (error) {
        console.error('获取群详情失败:', error);
        res.status(500).json({ code: 1, msg: '获取群详情失败' });
    }
};

// ===== Group Members =====

// GET /chat/groups/:groupId/members
exports.getGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const members = await ChatGroupMember.findAll({
            where: { group_id: groupId },
            include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'avatar_url'] }],
            order: [['role', 'ASC'], [['user', 'nickname'], 'ASC']]
        });

        const list = members.map(m => ({
            id: m.user.id, name: m.user.nickname, avatar: m.user.avatar_url || '', role: m.role
        }));

        res.json({ code: 0, msg: 'ok', data: { list, total: list.length } });
    } catch (error) {
        console.error('获取群成员失败:', error);
        res.status(500).json({ code: 1, msg: '获取群成员失败' });
    }
};

// POST /chat/groups/:groupId/members - Add members
exports.addGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { user_ids } = req.body;
        if (!user_ids || !Array.isArray(user_ids)) return res.status(400).json({ code: 1, msg: '需要 user_ids 数组' });

        const count = await ChatGroupMember.bulkCreate(
            user_ids.map(uid => ({ group_id: groupId, user_id: uid, role: 'member' })),
            { ignoreDuplicates: true }
        );
        await ChatGroup.increment(groupId, 'member_count', { by: count.length });

        res.json({ code: 0, msg: '添加成功', data: { added: count.length } });
    } catch (error) {
        console.error('添加群成员失败:', error);
        res.status(500).json({ code: 1, msg: '添加群成员失败' });
    }
};

// POST /chat/groups/:groupId/members/:userId/remove
exports.removeGroupMember = async (req, res) => {
    try {
        const { groupId, userId: removeUserId } = req.params;
        const currUserId = req.user.id;

        const currMember = await ChatGroupMember.findOne({ where: { group_id: groupId, user_id: currUserId } });
        if (!currMember || currMember.role !== 'owner') return res.status(403).json({ code: 1, msg: '只有群主可以移除成员' });

        const removed = await ChatGroupMember.destroy({ where: { group_id: groupId, user_id: removeUserId } });
        if (removed) await ChatGroup.decrement(groupId, 'member_count', { by: 1 });

        res.json({ code: 0, msg: '移除成功' });
    } catch (error) {
        console.error('移除群成员失败:', error);
        res.status(500).json({ code: 1, msg: '移除群成员失败' });
    }
};

// POST /chat/groups/:groupId/quit
exports.quitGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const member = await ChatGroupMember.findOne({ where: { group_id: groupId, user_id: userId } });
        if (member.role === 'owner') return res.status(400).json({ code: 1, msg: '群主不能退出，请先转让或解散群' });

        await member.destroy();
        await ChatGroup.decrement(groupId, 'member_count', { by: 1 });

        res.json({ code: 0, msg: '已退出群聊' });
    } catch (error) {
        console.error('退出群聊失败:', error);
        res.status(500).json({ code: 1, msg: '退出群聊失败' });
    }
};

// POST /chat/groups/:groupId/dismiss
exports.dismissGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const member = await ChatGroupMember.findOne({ where: { group_id: groupId, user_id: userId } });
        if (member.role !== 'owner') return res.status(403).json({ code: 1, msg: '只有群主可以解散群' });

        await ChatGroup.update({ is_dismissed: 1 }, { where: { id: groupId } });
        await ChatGroupMember.destroy({ where: { group_id: groupId } });
        await ChatGroupMessage.destroy({ where: { group_id: groupId } });

        res.json({ code: 0, msg: '群已解散' });
    } catch (error) {
        console.error('解散群聊失败:', error);
        res.status(500).json({ code: 1, msg: '解散群聊失败' });
    }
};

// ===== Group Messages =====

// GET /chat/groups/:groupId/messages
exports.getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const result = await ChatGroupMessage.findAndCountAll({
            where: { group_id: groupId },
            include: [{ model: User, as: 'sender', attributes: ['id', 'nickname', 'avatar_url'] }],
            order: [['created_at', 'DESC']],
            limit, offset
        });

        const list = result.rows.reverse().map(m => ({
            id: m.id, sender: m.sender, content: m.content,
            msg_type: m.msg_type, media_url: m.media_url, created_at: m.created_at
        }));

        res.json({ code: 0, msg: 'ok', data: { list, total: result.count } });
    } catch (error) {
        console.error('获取群消息失败:', error);
        res.status(500).json({ code: 1, msg: '获取群消息失败' });
    }
};

// POST /chat/groups/:groupId/messages
exports.sendGroupMessage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { content, msg_type, media_url } = req.body;
        const userId = req.user.id;

        if (!content) return res.status(400).json({ code: 1, msg: '消息内容不能为空' });

        const message = await ChatGroupMessage.create({
            group_id: groupId, sender_id: userId,
            content, msg_type: msg_type || 'text', media_url: media_url || ''
        });

        await ChatGroup.update(
            { last_message: content.substring(0, 500), last_message_at: new Date() },
            { where: { id: groupId } }
        );

        res.json({ code: 0, msg: 'ok', data: { ...message.toJSON(), sender: { id: userId } } });
    } catch (error) {
        console.error('发送群消息失败:', error);
        res.status(500).json({ code: 1, msg: '发送群消息失败' });
    }
};

// ===== Follow =====

// POST /chat/follow/:userId
exports.followUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (req.user.id == userId) return res.status(400).json({ code: 1, msg: '不能关注自己' });

        await UserFollow.findOrCreate({ where: { user_id: req.user.id, follow_user_id: userId } });
        res.json({ code: 0, msg: '关注成功' });
    } catch (error) {
        console.error('关注失败:', error);
        res.status(500).json({ code: 1, msg: '关注失败' });
    }
};

// POST /chat/unfollow/:userId
exports.unfollowUser = async (req, res) => {
    try {
        const { userId } = req.params;
        await UserFollow.destroy({ where: { user_id: req.user.id, follow_user_id: userId } });
        res.json({ code: 0, msg: '已取关' });
    } catch (error) {
        console.error('取关失败:', error);
        res.status(500).json({ code: 1, msg: '取关失败' });
    }
};
