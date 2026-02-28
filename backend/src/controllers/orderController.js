const { Order, Service, Category, User } = require('../models');

// 创建订单 (直接下单购买某个服务)
exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { service_id } = req.body;

        if (!service_id) {
            return res.status(400).json({ error: '请提供要购买的服务 ID' });
        }

        const service = await Service.findByPk(service_id);
        if (!service) {
            return res.status(404).json({ error: '服务不存在' });
        }

        // 创建一条简单的订单：关联用户和商品，并预填总价（商品价）及状态
        const newOrder = await Order.create({
            user_id: userId,
            service_id: service_id,
            total_amount: service.price,
            status: 'pending' // pending(待支付), paid(已支付)
        });

        res.status(201).json({
            message: '下单成功',
            data: newOrder
        });

    } catch (error) {
        console.error('下单失败:', error);
        res.status(500).json({ error: '下单失败' });
    }
};

// 获取我(当前登录用户)的订单列表
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const orders = await Order.findAndCountAll({
            where: { user_id: userId },
            offset: offset,
            limit: limit,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: Service,
                    as: 'service',
                    attributes: ['title', 'price', 'cover_image'],
                    include: [{ model: Category, as: 'category', attributes: ['name'] }]
                }
            ]
        });

        res.json({
            message: '获取成功',
            total: orders.count,
            page: page,
            limit: limit,
            data: orders.rows
        });
    } catch (error) {
        console.error('获取订单列表失败:', error);
        res.status(500).json({ error: '获取订单列表失败' });
    }
};

// 模拟支付 (将状态改为已支付)
exports.mockPayOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;

        const order = await Order.findOne({ where: { id: orderId, user_id: userId } });

        if (!order) {
            return res.status(404).json({ error: '订单不存在或无权操作' });
        }

        if (order.status === 'paid') {
            return res.status(400).json({ error: '订单已支付过' });
        }

        order.status = 'paid';
        await order.save();

        res.json({ message: '模拟支付成功', data: order });

    } catch (error) {
        console.error('模拟支付失败:', error);
        res.status(500).json({ error: '模拟支付失败' });
    }
};
