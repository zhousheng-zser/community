require('dotenv').config();
const {
    sequelize,
    Sequelize,
    Banner,
    Category,
    Service,
    Shop,
    Good,
    Feed,
    User,
    Order,
    Promotion,
    Conversation,
    UserConversation,
    Message,
    Post,
    Comment,
    Like
} = require('./src/models');

const now = () => new Date();

const ensureJdUnionTables = async (t) => {
    await sequelize.query(
        `
        CREATE TABLE IF NOT EXISTS jd_products (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            scene VARCHAR(32) NOT NULL DEFAULT 'benefit_card',
            sku_id BIGINT NOT NULL,
            title VARCHAR(255) NOT NULL,
            image_url VARCHAR(512) NOT NULL,
            price DECIMAL(10,2) NULL,
            rebate_amount DECIMAL(10,2) NULL,
            sort_order INT NOT NULL DEFAULT 0,
            status TINYINT NOT NULL DEFAULT 1,
            raw_json JSON NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_scene_sku (scene, sku_id),
            INDEX idx_scene_status_sort (scene, status, sort_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
        { transaction: t }
    );

    await sequelize.query(
        `
        CREATE TABLE IF NOT EXISTS jd_pid_channels (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            channel_key VARCHAR(64) NOT NULL,
            pid VARCHAR(64) NOT NULL,
            status TINYINT NOT NULL DEFAULT 1,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_channel (channel_key),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
        { transaction: t }
    );

    await sequelize.query(
        `
        CREATE TABLE IF NOT EXISTS jd_promotion_links (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            scene VARCHAR(32) NOT NULL DEFAULT 'benefit_card',
            sku_id BIGINT NOT NULL,
            pid VARCHAR(64) NOT NULL,
            spread_url VARCHAR(512) NOT NULL,
            short_url VARCHAR(512) NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_scene_sku_pid (scene, sku_id, pid),
            INDEX idx_pid (pid)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
        { transaction: t }
    );

    await sequelize.query(
        `
        CREATE TABLE IF NOT EXISTS jd_click_logs (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            user_id BIGINT NULL,
            scene VARCHAR(32) NOT NULL DEFAULT 'benefit_card',
            sku_id BIGINT NULL,
            pid VARCHAR(64) NULL,
            spread_url VARCHAR(512) NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_time (user_id, createdAt),
            INDEX idx_sku_time (sku_id, createdAt),
            INDEX idx_pid_time (pid, createdAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
        { transaction: t }
    );

    await sequelize.query(
        `
        CREATE TABLE IF NOT EXISTS jd_orders (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            jd_order_id VARCHAR(64) NOT NULL,
            scene VARCHAR(32) NOT NULL DEFAULT 'benefit_card',
            user_id BIGINT NULL,
            pid VARCHAR(64) NULL,
            sku_id BIGINT NULL,
            product_name VARCHAR(255) NULL,
            order_time DATETIME NULL,
            finish_time DATETIME NULL,
            order_status VARCHAR(32) NULL,
            pay_price DECIMAL(10,2) NULL,
            estimate_fee DECIMAL(10,2) NULL,
            actual_fee DECIMAL(10,2) NULL,
            raw_json JSON NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_jd_order (jd_order_id),
            INDEX idx_order_time (order_time),
            INDEX idx_user (user_id),
            INDEX idx_pid (pid)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
        { transaction: t }
    );

    await sequelize.query(
        `
        CREATE TABLE IF NOT EXISTS jd_sync_cursor (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(64) NOT NULL,
            cursor_value VARCHAR(128) NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
        { transaction: t }
    );
};

const seedJdUnionData = async (t) => {
    const pid = process.env.JD_PID || '';
    if (pid) {
        await sequelize.query(
            `
            INSERT INTO jd_pid_channels (channel_key, pid, status, createdAt, updatedAt)
            VALUES ('default', :pid, 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE pid = VALUES(pid), status = 1, updatedAt = NOW()
            `,
            { transaction: t, replacements: { pid } }
        );
    }

    const products = [
        { scene: 'benefit_card', sku_id: 100010713464, title: '农夫山泉饮用水', image_url: 'https://img14.360buyimg.com/n1/jfs/t1/109790/26/17784/177728/5e8c0ec6E92281c9a/7df0d2c6d1a6c0bf.jpg', price: 19.9, sort_order: 1 },
        { scene: 'benefit_card', sku_id: 100012345678, title: '汽车蓝牙音箱', image_url: 'https://img14.360buyimg.com/n1/jfs/t1/204916/15/3368/156780/616a4f5aE4d1f7b4e/2e09b5f508a403ef.jpg', price: 99.0, sort_order: 2 }
    ];

    for (const p of products) {
        await sequelize.query(
            `
            INSERT INTO jd_products (scene, sku_id, title, image_url, price, rebate_amount, sort_order, status, createdAt, updatedAt)
            VALUES (:scene, :sku_id, :title, :image_url, :price, NULL, :sort_order, 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
              title = VALUES(title),
              image_url = VALUES(image_url),
              price = VALUES(price),
              sort_order = VALUES(sort_order),
              status = 1,
              updatedAt = NOW()
            `,
            { transaction: t, replacements: p }
        );
    }
};

const ensureSystemUser = async (t) => {
    const systemUser = await sequelize.query("SELECT * FROM Users WHERE id = 0", {
        type: Sequelize.QueryTypes.SELECT,
        transaction: t
    });
    if (systemUser && systemUser.length > 0) return;

    await sequelize.query("SET SESSION sql_mode='NO_AUTO_VALUE_ON_ZERO'", { transaction: t });
    await sequelize.query(
        `
        INSERT INTO Users (id, openid, nickname, avatar_url, createdAt, updatedAt)
        VALUES (0, 'system', '系统广播机器人', '/img/placeholders/home_cleaning.png', NOW(), NOW())
        `,
        { transaction: t }
    );
    await sequelize.query("SET SESSION sql_mode=''", { transaction: t });
};

const ensureUser = async (t, { id, openid, nickname, avatar_url, role, balance }) => {
    const existing = await User.findOne({ where: { openid }, transaction: t });
    if (existing) {
        await existing.update({ nickname, avatar_url, role, balance }, { transaction: t });
        return existing;
    }
    return User.create(
        {
            ...(id != null ? { id } : {}),
            openid,
            nickname,
            avatar_url,
            role,
            balance
        },
        { transaction: t }
    );
};

const upsertBy = async (t, model, where, values) => {
    const existing = await model.findOne({ where, transaction: t });
    if (existing) {
        await existing.update(values, { transaction: t });
        return existing;
    }
    return model.create(values, { transaction: t });
};

async function seedDemo() {
    const reset = process.argv.includes('--reset');

    const t = await sequelize.transaction();
    try {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true, transaction: t });
        await ensureSystemUser(t);

        if (reset) {
            await Promotion.destroy({ truncate: true, cascade: true, transaction: t });
            await Order.destroy({ truncate: true, cascade: true, transaction: t });
            await Feed.destroy({ truncate: true, cascade: true, transaction: t });
            await Good.destroy({ truncate: true, cascade: true, transaction: t });
            await Shop.destroy({ truncate: true, cascade: true, transaction: t });
            await Service.destroy({ truncate: true, cascade: true, transaction: t });
            await Category.destroy({ truncate: true, cascade: true, transaction: t });
            await Banner.destroy({ truncate: true, cascade: true, transaction: t });
            await Like.destroy({ truncate: true, cascade: true, transaction: t });
            await Comment.destroy({ truncate: true, cascade: true, transaction: t });
            await Post.destroy({ truncate: true, cascade: true, transaction: t });
            await Message.destroy({ truncate: true, cascade: true, transaction: t });
            await UserConversation.destroy({ truncate: true, cascade: true, transaction: t });
            await Conversation.destroy({ truncate: true, cascade: true, transaction: t });

            const demoUsers = await User.findAll({
                where: { openid: { [Sequelize.Op.like]: 'demo_openid_%' } },
                transaction: t
            });
            for (const u of demoUsers) await u.destroy({ transaction: t });
        }

        const demoUsers = [
            await ensureUser(t, {
                id: 1001,
                openid: 'demo_openid_1001',
                nickname: '演示用户-张三',
                avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80',
                role: 'user',
                balance: 0
            }),
            await ensureUser(t, {
                id: 1002,
                openid: 'demo_openid_1002',
                nickname: '演示推客-李四',
                avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&q=80',
                role: 'promoter',
                balance: 128.5
            }),
            await ensureUser(t, {
                id: 1003,
                openid: 'demo_openid_1003',
                nickname: '演示商家-店长',
                avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80',
                role: 'admin',
                balance: 0
            })
        ];

        await upsertBy(
            t,
            Banner,
            { sort_order: 1 },
            { image_url: 'https://via.placeholder.com/600x300/ff7f50/ffffff?text=Demo+Banner+1', target_url: '/pages/index/index', sort_order: 1 }
        );
        await upsertBy(
            t,
            Banner,
            { sort_order: 2 },
            { image_url: 'https://via.placeholder.com/600x300/6495ed/ffffff?text=Demo+Banner+2', target_url: '/pages/community/community', sort_order: 2 }
        );

        const categoryClean = await upsertBy(t, Category, { name: '家政服务' }, { name: '家政服务', icon_url: 'https://via.placeholder.com/100?text=Clean', sort_order: 1 });
        const categoryRepair = await upsertBy(t, Category, { name: '维修服务' }, { name: '维修服务', icon_url: 'https://via.placeholder.com/100?text=Repair', sort_order: 2 });
        const categorySecond = await upsertBy(t, Category, { name: '二手交易' }, { name: '二手交易', icon_url: 'https://via.placeholder.com/100?text=SecondHand', sort_order: 3 });

        const services = [
            await upsertBy(t, Service, { title: '日常保洁 3小时' }, { category_id: categoryClean.id, title: '日常保洁 3小时', description: '含厨房+卫生间深度清洁，专业阿姨上门。', price: 150.0, cover_image: 'https://via.placeholder.com/300?text=Cleaning+Service', sales_count: 120 }),
            await upsertBy(t, Service, { title: '深度开荒保洁 5小时' }, { category_id: categoryClean.id, title: '深度开荒保洁 5小时', description: '新房开荒/搬家后清洁，含玻璃与地面。', price: 299.0, cover_image: 'https://via.placeholder.com/300?text=Deep+Clean', sales_count: 65 }),
            await upsertBy(t, Service, { title: '家电维修检测' }, { category_id: categoryRepair.id, title: '家电维修检测', description: '上门检测，快速定位故障并给出报价。', price: 50.0, cover_image: 'https://via.placeholder.com/300?text=Repair+Service', sales_count: 85 }),
            await upsertBy(t, Service, { title: '九成新自行车' }, { category_id: categorySecond.id, title: '九成新自行车', description: '闲置公路车一台，可小刀。', price: 300.0, cover_image: 'https://via.placeholder.com/300?text=Bike', sales_count: 1 })
        ];

        const shop1 = await upsertBy(t, Shop, { name: '邻里好物旗舰店' }, { name: '邻里好物旗舰店', logo_url: 'https://via.placeholder.com/120?text=Shop+1', description: '社区精选好物，支持同城次日达。', status: 'open' });
        const shop2 = await upsertBy(t, Shop, { name: '家电维修官方店' }, { name: '家电维修官方店', logo_url: 'https://via.placeholder.com/120?text=Shop+2', description: '维修配件与工具专卖。', status: 'open' });

        const goods = [
            await upsertBy(t, Good, { title: '除螨仪（家用）' }, { title: '除螨仪（家用）', price: 399.0, commission: 39.9, cover_image: 'https://via.placeholder.com/300?text=Mite+Cleaner', detail_images: ['https://via.placeholder.com/600?text=Mite+1', 'https://via.placeholder.com/600?text=Mite+2'], stock: 120, tab_category: '本地集市', shop_id: shop1.id }),
            await upsertBy(t, Good, { title: '螺丝刀套装 24合1' }, { title: '螺丝刀套装 24合1', price: 59.0, commission: 8.0, cover_image: 'https://via.placeholder.com/300?text=Tool+Set', detail_images: ['https://via.placeholder.com/600?text=Tool+1', 'https://via.placeholder.com/600?text=Tool+2'], stock: 300, tab_category: '本地集市', shop_id: shop2.id })
        ];

        await upsertBy(t, Feed, { title: '3分钟教你判断空调该不该清洗' }, { title: '3分钟教你判断空调该不该清洗', author_id: demoUsers[1].id, likes_count: 128, media_type: 'video', media_url: 'https://www.w3schools.com/html/mov_bbb.mp4', related_goods_id: goods[0].id });
        await upsertBy(t, Feed, { title: '收纳技巧：小户型也能整整齐齐' }, { title: '收纳技巧：小户型也能整整齐齐', author_id: demoUsers[0].id, likes_count: 67, media_type: 'image', media_url: 'https://via.placeholder.com/600x900?text=Feed+Image', related_goods_id: goods[1].id });

        const order1 = await Order.create(
            {
                order_no: `DEMO${Date.now()}001`,
                user_id: demoUsers[0].id,
                service_id: services[0].id,
                goods_id: null,
                promoter_id: demoUsers[1].id,
                total_amount: services[0].price,
                status: 'pending'
            },
            { transaction: t }
        );
        await Promotion.create(
            {
                order_id: order1.id,
                promoter_id: demoUsers[1].id,
                amount: 15.0,
                status: 'pending',
                createdAt: now(),
                updatedAt: now()
            },
            { transaction: t }
        );

        const sysConv = await Conversation.create({ type: 'system', last_message_preview: '演示活动：全场立减 10 元' }, { transaction: t });
        await UserConversation.create(
            { user_id: demoUsers[0].id, conversation_id: sysConv.id, peer_id: 0, unread_count: 1, is_deleted: false, bot_type: 'event' },
            { transaction: t }
        );
        await Message.create({ conversation_id: sysConv.id, sender_id: 0, msg_type: 'text', content: '演示活动：全场立减 10 元，今晚 8 点活动专场。' }, { transaction: t });

        const privateConv = await Conversation.create({ type: 'private', last_message_preview: '好的，马上安排师傅上门。' }, { transaction: t });
        await UserConversation.create({ user_id: demoUsers[0].id, conversation_id: privateConv.id, peer_id: demoUsers[1].id, unread_count: 0, is_deleted: false }, { transaction: t });
        await UserConversation.create({ user_id: demoUsers[1].id, conversation_id: privateConv.id, peer_id: demoUsers[0].id, unread_count: 2, is_deleted: false }, { transaction: t });
        await Message.create({ conversation_id: privateConv.id, sender_id: demoUsers[0].id, msg_type: 'text', content: '你好，我想预约日常保洁。' }, { transaction: t });
        await Message.create({ conversation_id: privateConv.id, sender_id: demoUsers[1].id, msg_type: 'text', content: '好的，马上安排师傅上门。' }, { transaction: t });
        await Message.create({ conversation_id: privateConv.id, sender_id: demoUsers[1].id, msg_type: 'text', content: '请问方便的时间段是今天还是明天？' }, { transaction: t });

        const tabTypes = ['热门话题', '热门活动', '邻里互动'];
        const postPayloads = [
            { title: '小区停车难怎么破？', desc: '每天晚上都在车库绕半天，有没有更好的方案？', images: [] },
            { title: '周末亲子活动报名啦', desc: '本周六下午在喷泉广场集合，欢迎参加。', images: ['/img/placeholders/home_cleaning.png'] },
            { title: '借个电钻用用', desc: '想在墙上打孔安架子，谁家方便借下工具？', images: [] }
        ];

        for (let i = 0; i < 12; i++) {
            const p = postPayloads[i % postPayloads.length];
            const author = demoUsers[i % demoUsers.length];
            const category = tabTypes[i % tabTypes.length];
            const post = await Post.create(
                {
                    user_id: author.id,
                    content: JSON.stringify({ title: p.title, desc: p.desc }),
                    images: p.images,
                    location: i % 2 === 0 ? '社区广场' : '',
                    category
                },
                { transaction: t }
            );

            const commentCount = (i % 4) + 1;
            for (let j = 0; j < commentCount; j++) {
                const commenter = demoUsers[(i + j + 1) % demoUsers.length];
                await Comment.create({ post_id: post.id, user_id: commenter.id, content: '支持一下！' }, { transaction: t });
            }

            const likeUser = demoUsers[(i + 2) % demoUsers.length];
            await Like.create({ post_id: post.id, user_id: likeUser.id }, { transaction: t });
        }

        await ensureJdUnionTables(t);
        await seedJdUnionData(t);

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true, transaction: t });
        await t.commit();

        console.log('Demo seeding completed.');
        process.exit(0);
    } catch (e) {
        await t.rollback();
        console.error('Demo seeding failed:', e);
        process.exit(1);
    }
}

seedDemo();
