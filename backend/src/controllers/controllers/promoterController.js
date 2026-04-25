const { PromoterCommission, PromoterWithdrawal, User, MarketOrder } = require('../models');
const { Op } = require('sequelize');

// GET /promoter/commission - Get commission info
exports.getCommission = async (req, res) => {
    try {
        const userId = req.user.id;

        let commission = await PromoterCommission.findOne({ where: { user_id: userId } });
        if (!commission) {
            commission = await PromoterCommission.create({ user_id: userId, status: 'available' });
        }

        const totalAmount = Number(commission.commission_amount || 0);
        const withdrawals = await PromoterWithdrawal.sum('amount', {
            where: { user_id: userId, status: { [Op.in]: ['completed', 'processing'] } }
        });
        const withdrawnAmount = Number(withdrawals || 0);
        const availableAmount = Math.max(0, totalAmount - withdrawnAmount);
        const pendingAmount = 0;

        res.json({ code: 0, msg: 'ok', data: {
            total_amount: totalAmount,
            available_amount: availableAmount,
            pending_amount: pendingAmount,
            withdrawn_amount: withdrawnAmount,
            totalAcount: totalAmount,
            availAcount: availableAmount,
            unPointAcount: pendingAmount
        }});
    } catch (error) {
        console.error('获取佣金信息失败:', error);
        res.status(500).json({ code: 1, msg: '获取佣金信息失败' });
    }
};

// GET /promoter/orders - Get promoter orders
exports.getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const offset = (page - 1) * limit;

        const commissions = await PromoterCommission.findAndCountAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit, offset
        });

        const list = commissions.rows.map(c => ({
            id: c.id, order_id: c.order_id, order_type: c.order_type,
            commission_amount: Number(c.commission_amount || 0),
            status: c.status, created_at: c.created_at
        }));

        res.json({ code: 0, msg: 'ok', data: { list, total: commissions.count, page } });
    } catch (error) {
        console.error('获取推客订单失败:', error);
        res.status(500).json({ code: 1, msg: '获取推客订单失败' });
    }
};

// GET /promoter/income-records - Get income records
exports.getIncomeRecords = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.page_size) || 20;
        const offset = (page - 1) * pageSize;

        const commissions = await PromoterCommission.findAndCountAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit: pageSize, offset
        });

        const withdrawals = await PromoterWithdrawal.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit: pageSize, offset
        });

        const list = [
            ...commissions.rows.map(c => ({
                id: 'c_' + c.id, type: 'commission', amount: Number(c.commission_amount || 0),
                order_id: c.order_id, status: c.status, created_at: c.created_at
            })),
            ...withdrawals.map(w => ({
                id: 'w_' + w.id, type: 'withdrawal', amount: -Number(w.amount || 0),
                remark: w.remark, status: w.status, created_at: w.created_at
            }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({ code: 0, msg: 'ok', data: { list, total: list.length, page } });
    } catch (error) {
        console.error('获取收益明细失败:', error);
        res.status(500).json({ code: 1, msg: '获取收益明细失败' });
    }
};

// POST /promoter/withdraw - Withdraw
exports.withdraw = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount } = req.body;

        if (!amount || Number(amount) <= 0) return res.status(400).json({ code: 1, msg: '提现金额需大于0' });

        let commission = await PromoterCommission.findOne({ where: { user_id: userId } });
        const totalAmount = Number(commission ? commission.commission_amount : 0);
        const withdrawals = await PromoterWithdrawal.sum('amount', {
            where: { user_id: userId, status: { [Op.in]: ['pending', 'processing'] } }
        });
        const available = Math.max(0, totalAmount - Number(withdrawals || 0));

        if (Number(amount) > available) return res.status(400).json({ code: 1, msg: '可提现金额不足' });

        const withdrawal = await PromoterWithdrawal.create({
            user_id: userId, amount: Number(amount), status: 'pending'
        });

        res.json({ code: 0, msg: '提现申请已提交', data: withdrawal.toJSON() });
    } catch (error) {
        console.error('提现失败:', error);
        res.status(500).json({ code: 1, msg: '提现失败' });
    }
};

// GET /promoter/share-link - Get share link
exports.getShareLink = async (req, res) => {
    try {
        const { goods_id } = req.query;
        const userId = req.user.id;

        const user = await User.findByPk(userId, { attributes: ['id', 'openid'] });

        res.json({ code: 0, msg: 'ok', data: {
            share_link: `/pages/index/index?openid=${user && user.openid || ''}${goods_id ? '&goodsId=' + goods_id : ''}`,
            user_id: userId, goods_id: goods_id || ''
        }});
    } catch (error) {
        console.error('获取推广链接失败:', error);
        res.status(500).json({ code: 1, msg: '获取推广链接失败' });
    }
};
