require('dotenv').config({ path: __dirname + '/.env' });
const { User, Conversation, UserConversation, Message, sequelize } = require('./src/models');

const mockAvatars = [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80',
    'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=120&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&q=80',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80'
];

const mockNames = ['天猫旗舰店', '快递助手', '附近老管家', '迪卡侬', '木工小李', '清洁阿姨', '花椒官方', '型公馆旗舰店', '百草味', 'ZSER粉丝'];

async function seed() {
    console.log('开始生成虚拟聊天数据...');
    const t = await sequelize.transaction();
    try {
        // 0. 确保系统账号 User 0 存在以满足外键约束
        let systemUser = await sequelize.query("SELECT * FROM Users WHERE id = 0", { type: sequelize.QueryTypes.SELECT, transaction: t });
        if (!systemUser || systemUser.length === 0) {
            await sequelize.query("SET SESSION sql_mode='NO_AUTO_VALUE_ON_ZERO'", { transaction: t });
            await sequelize.query(`
                INSERT INTO Users (id, nickname, avatar_url, createdAt, updatedAt) 
                VALUES (0, '系统广播机器人', '/img/placeholders/home_cleaning.png', NOW(), NOW())
            `, { transaction: t });
            // 恢复默认的 auto_increment 行为，否则后续所有的创建都会报主键 0 重复错误
            await sequelize.query("SET SESSION sql_mode=''", { transaction: t });
            console.log('创建系统虚拟账号 (ID: 0)');
        }

        // 1. 确保主要测试对象 User 2 存在
        let mainUser = await User.findByPk(2, { transaction: t });
        if (!mainUser) {
            mainUser = await User.create({ id: 2, nickname: 'zser测试账号', avatar_url: mockAvatars[0] }, { transaction: t });
            console.log('创建主测试账号 (ID: 2)');
        }

        // 2. 生成 10 个虚拟用户 (如果不存在)
        const fakeUsers = [];
        for (let i = 0; i < 10; i++) {
            let u = await User.findOne({ where: { nickname: mockNames[i] }, transaction: t });
            if (!u) {
                u = await User.create({
                    nickname: mockNames[i],
                    avatar_url: mockAvatars[i]
                }, { transaction: t });
            }
            fakeUsers.push(u);
        }
        console.log('10 个虚构对话用户已就绪.');

        // 3. 生成系统广播 (活动优惠)
        let systemConv = await Conversation.findOne({ where: { type: 'system', last_message_preview: '恭喜您已解锁会员身份！' }, transaction: t });
        if (!systemConv) {
            systemConv = await Conversation.create({ type: 'system', last_message_preview: '恭喜您已解锁会员身份！' }, { transaction: t });
            await Message.create({ conversation_id: systemConv.id, sender_id: 0, msg_type: 'text', content: '恭喜您已解锁会员身份！双十一全场半价。' }, { transaction: t });

            await UserConversation.findOrCreate({
                where: { user_id: 2, peer_id: 0, bot_type: 'event' },
                defaults: { conversation_id: systemConv.id, unread_count: 1, is_deleted: false, bot_type: 'event' },
                transaction: t
            });
            console.log('创建系统活动消息完毕.');
        }

        // 4. 生成我自己的自言自语（备忘录）
        let selfConvMapping = await UserConversation.findOne({ where: { user_id: 2, peer_id: 2 }, transaction: t });
        if (!selfConvMapping) {
            let selfConv = await Conversation.create({ type: 'private', last_message_preview: '这是发给我自己的备忘图片' }, { transaction: t });
            await UserConversation.create({ user_id: 2, conversation_id: selfConv.id, peer_id: 2, unread_count: 0 }, { transaction: t });
            await Message.create({ conversation_id: selfConv.id, sender_id: 2, msg_type: 'text', content: '这是一条文件传输助手消息' }, { transaction: t });
            await Message.create({ conversation_id: selfConv.id, sender_id: 2, msg_type: 'image', content: 'https://images.unsplash.com/photo-1556911220-bda9f7f7597e?w=300&q=80' }, { transaction: t });
            console.log('创建自言自语会话完毕.');
        }

        // 5. 生成我和那10个角色的聊天
        for (let i = 0; i < fakeUsers.length; i++) {
            let fakeUser = fakeUsers[i];
            let existMapping = await UserConversation.findOne({ where: { user_id: 2, peer_id: fakeUser.id }, transaction: t });
            if (existMapping) continue; // 已经建过就不重复建了

            let isUnread = i % 2 !== 0; // 一半未读，一半已读
            let lastMsg = '';

            const conv = await Conversation.create({ type: 'private', last_message_preview: '' }, { transaction: t });

            // 建立映射
            await UserConversation.create({ user_id: 2, conversation_id: conv.id, peer_id: fakeUser.id, unread_count: isUnread ? (i + 1) : 0 }, { transaction: t });
            await UserConversation.create({ user_id: fakeUser.id, conversation_id: conv.id, peer_id: 2, unread_count: 0 }, { transaction: t });

            // 塞两句普通的文本对话
            await Message.create({ conversation_id: conv.id, sender_id: 2, msg_type: 'text', content: `你好，${fakeUser.nickname} 在吗？` }, { transaction: t });

            if (i % 3 === 0) {
                // 偶尔发个带图的
                lastMsg = '这是商品详情图';
                await Message.create({ conversation_id: conv.id, sender_id: fakeUser.id, msg_type: 'image', content: 'https://images.unsplash.com/photo-1542204625-de293a36f5c5?w=300&q=80' }, { transaction: t });
                await Message.create({ conversation_id: conv.id, sender_id: fakeUser.id, msg_type: 'text', content: lastMsg }, { transaction: t });
            } else {
                lastMsg = `好的，[点击查看详情]`;
                await Message.create({ conversation_id: conv.id, sender_id: fakeUser.id, msg_type: 'text', content: lastMsg }, { transaction: t });
            }

            if (isUnread) {
                lastMsg = `这里还有优惠卷待领取哦~`;
                await Message.create({ conversation_id: conv.id, sender_id: fakeUser.id, msg_type: 'text', content: lastMsg }, { transaction: t });
            }

            await conv.update({ last_message_preview: lastMsg }, { transaction: t });
        }
        console.log('10 组私聊对谈生成完毕.');

        await t.commit();
        console.log('成功！虚拟数据已全部落盘。');
        process.exit(0);
    } catch (err) {
        await t.rollback();
        console.error('播种失败:');
        console.error(err.message);
        if (err.errors) console.error('Validation details:', JSON.stringify(err.errors, null, 2));
        if (err.sql) console.error('SQL:', err.sql);
        process.exit(1);
    }
}

seed();
