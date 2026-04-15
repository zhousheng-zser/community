const { LiveStreamConfig } = require('../models');

/**
 * GET /api/v1/lives/active
 * 小程序端拉取家推展示的活跃直播源，按 sort_order 降序
 * 可选 ?category=热推直播间
 */
exports.getActive = async (req, res) => {
    try {
        const category = req.query.category;
        const where = { is_active: 1 };
        if (category) where.category = category;
        const list = await LiveStreamConfig.findAll({
            where,
            order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
            attributes: ['id', 'category', 'title', 'avatar_url', 'brand_logo', 'cover_image', 'rebate_info', 'promoters_count', 'hot_goods', 'finder_username', 'feed_id']
        });
        res.json({ message: '获取成功', data: list });
    } catch (e) {
        console.error('lives/active 失败:', e);
        res.status(500).json({ error: '获取失败' });
    }
};
