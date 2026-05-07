const { BenefitCoinGoods, BenefitCoinExchange, User } = require('../../../models');
const { Op } = require('sequelize');

// GET /benefit-coin/balance - Get user's benefit coin balance
exports.getBalance = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: ['id', 'points'] });
        const balance = user ? (user.points || 0) : 0;

        const totalSpent = await BenefitCoinExchange.sum('coins_spent', { where: { user_id: req.user.id, status: 'completed' } });

        res.json({ code: 0, msg: 'ok', data: { balance: Number(balance), total_spent: Number(totalSpent || 0) } });
    } catch (error) {
        console.error('获取家事币余额失败:', error);
        res.status(500).json({ code: 1, msg: '获取家事币余额失败' });
    }
};

// GET /benefit-coin/goods - Get exchangeable goods list
exports.getExchangeGoods = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.page_size) || 20;
        const offset = (page - 1) * pageSize;

        const result = await BenefitCoinGoods.findAndCountAll({
            where: { status: 'active', stock: { [Op.gt]: 0 } },
            order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
            limit: pageSize, offset
        });

        const list = result.rows.map(g => ({
            id: g.id, name: g.name, description: g.description,
            image: g.image_url || g.image_url, coins: g.coins,
            stock: g.stock, sold_count: g.sold_count,
            images: g.images
        }));

        res.json({ code: 0, msg: 'ok', data: { list, total: result.count, page, page_size: pageSize } });
    } catch (error) {
        console.error('获取兑换商品失败:', error);
        res.status(500).json({ code: 1, msg: '获取兑换商品失败' });
    }
};

// GET /benefit-coin/goods/:goodsId - Get goods detail
exports.getExchangeGoodsDetail = async (req, res) => {
    try {
        const goods = await BenefitCoinGoods.findByPk(req.params.goodsId);
        if (!goods) return res.status(404).json({ code: 1, msg: '商品不存在' });

        res.json({ code: 0, msg: 'ok', data: {
            id: goods.id, name: goods.name, description: goods.description,
            image: goods.image_url, coins: goods.coins,
            stock: goods.stock, sold_count: goods.sold_count,
            images: goods.images, status: goods.status
        }});
    } catch (error) {
        console.error('获取商品详情失败:', error);
        res.status(500).json({ code: 1, msg: '获取商品详情失败' });
    }
};

// POST /benefit-coin/exchange - Exchange goods
exports.exchangeGoods = async (req, res) => {
    try {
        const { goods_id, quantity = 1 } = req.body;
        const userId = req.user.id;

        if (!goods_id) return res.status(400).json({ code: 1, msg: '需要 goods_id' });

        const goods = await BenefitCoinGoods.findByPk(goods_id);
        if (!goods || goods.status !== 'active') return res.status(404).json({ code: 1, msg: '商品不存在或已下架' });
        if (goods.stock < quantity) return res.status(400).json({ code: 1, msg: '库存不足' });

        const user = await User.findByPk(userId, { attributes: ['id', 'points'] });
        const totalCoins = goods.coins * quantity;
        if ((user.points || 0) < totalCoins) return res.status(400).json({ code: 1, msg: '家事币余额不足' });

        const t = await BenefitCoinGoods.sequelize.transaction();
        try {
            await user.decrement('points', { by: totalCoins, transaction: t });
            await goods.decrement('stock', { by: quantity, transaction: t });
            await goods.increment('sold_count', { by: quantity, transaction: t });

            const exchange = await BenefitCoinExchange.create({
                user_id: userId, goods_id: goods.id,
                goods_name: goods.name, coins_spent: totalCoins,
                quantity, status: 'completed'
            }, { transaction: t });

            await t.commit();
            res.json({ code: 0, msg: '兑换成功', data: exchange.toJSON() });
        } catch (e) {
            await t.rollback();
            throw e;
        }
    } catch (error) {
        console.error('兑换失败:', error);
        res.status(500).json({ code: 1, msg: error.message || '兑换失败' });
    }
};

// GET /benefit-coin/records - Get exchange records
exports.getExchangeRecords = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.page_size) || 20;
        const offset = (page - 1) * pageSize;

        const result = await BenefitCoinExchange.findAndCountAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit: pageSize, offset
        });

        const list = result.rows.map(r => ({
            id: r.id, goods_id: r.goods_id, goods_name: r.goods_name,
            coins_spent: r.coins_spent, quantity: r.quantity,
            status: r.status, created_at: r.created_at
        }));

        res.json({ code: 0, msg: 'ok', data: { list, total: result.count, page, page_size: pageSize } });
    } catch (error) {
        console.error('获取兑换记录失败:', error);
        res.status(500).json({ code: 1, msg: '获取兑换记录失败' });
    }
};
