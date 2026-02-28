const { Category, Service, Banner } = require('../models');

// 获取首页轮播图
exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.findAll({
            order: [['sort_order', 'ASC']]
        });
        res.json({ message: '获取轮播图成功', data: banners });
    } catch (error) {
        console.error('获取轮播图失败:', error);
        res.status(500).json({ error: '获取轮播图失败' });
    }
};

// 获取全部分类
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [['sort_order', 'ASC']]
        });
        res.json({ message: '获取分类成功', data: categories });
    } catch (error) {
        console.error('获取分类失败:', error);
        res.status(500).json({ error: '获取分类失败' });
    }
};

// 获取推荐服务（首页展示用）
exports.getHotServices = async (req, res) => {
    try {
        const services = await Service.findAll({
            limit: 6, // 首页推荐 6 个
            order: [['sales_count', 'DESC']], // 按销量倒序
            include: [{ model: Category, as: 'category', attributes: ['name'] }]
        });
        res.json({ message: '获取推荐服务成功', data: services });
    } catch (error) {
        console.error('获取推荐服务失败:', error);
        res.status(500).json({ error: '获取推荐服务失败' });
    }
};

// 根据分类获取服务列表
exports.getServicesByCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const services = await Service.findAndCountAll({
            where: { category_id: categoryId },
            offset: offset,
            limit: limit,
            order: [['createdAt', 'DESC']],
            include: [{ model: Category, as: 'category', attributes: ['name'] }]
        });
        res.json({
            message: '获取成功',
            total: services.count,
            page: page,
            limit: limit,
            data: services.rows
        });
    } catch (error) {
        console.error('获取服务列表失败:', error);
        res.status(500).json({ error: '获取服务列表失败' });
    }
};

// 获取服务详情
exports.getServiceDetail = async (req, res) => {
    try {
        const serviceId = req.params.id;
        const service = await Service.findByPk(serviceId, {
            include: [{ model: Category, as: 'category', attributes: ['name', 'icon_url'] }]
        });

        if (!service) {
            return res.status(404).json({ error: '服务不存在' });
        }
        res.json({ message: '获取成功', data: service });
    } catch (error) {
        console.error('获取详情失败:', error);
        res.status(500).json({ error: '获取详情失败' });
    }
};
