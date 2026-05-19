const { PromoterWithdrawal, CommissionDistribution, PartnerCommissionBalance, User } = require('../../../models');
const commissionService = require('../../commission/services/commission.service');
const { Op } = require('sequelize');
const { resolveUserIdFromReq } = require('../../../utils/resolveUserId');

function uidFromReq(req) {
  return resolveUserIdFromReq(req);
}

// GET /promoter/commission - Get commission info (backward compatible, uses new balance tables)
exports.getCommission = async (req, res) => {
    try {
        const userId = uidFromReq(req);
        if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
        const summary = await commissionService.getUserBalance(userId);

        res.json({ code: 0, msg: 'ok', data: {
            total_amount: summary.total_earned,
            available_amount: summary.available_amount,
            pending_amount: summary.pending_amount,
            withdrawn_amount: summary.withdrawn_amount,
            totalAcount: summary.total_earned,
            availAcount: summary.available_amount,
            unPointAcount: summary.pending_amount
        }});
    } catch (error) {
        console.error('获取佣金信息失败:', error);
        res.status(500).json({ code: 1, msg: '获取佣金信息失败' });
    }
};

// GET /promoter/orders - Get promoter orders (uses new commission_distributions table)
exports.getOrders = async (req, res) => {
    try {
        const userId = uidFromReq(req);
        if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const offset = (page - 1) * limit;

        const where = { beneficiary_user_id: userId };
        if (status === 'pending') where.status = { [Op.in]: ['pending', 'available'] };
        else if (status === 'done') where.status = 'withdrawn';

        const result = await CommissionDistribution.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit, offset
        });

        const list = result.rows.map(c => ({
            id: c.id, order_id: c.order_id, order_type: c.order_type,
            commission_amount: Number(c.commission_amount || 0),
            status: c.status, created_at: c.created_at
        }));

        res.json({ code: 0, msg: 'ok', data: { list, total: result.count, page } });
    } catch (error) {
        console.error('获取推客订单失败:', error);
        res.status(500).json({ code: 1, msg: '获取推客订单失败' });
    }
};

// GET /promoter/income-records - Get income records (uses new tables)
exports.getIncomeRecords = async (req, res) => {
    try {
        const userId = uidFromReq(req);
        if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.page_size) || 20;
        const offset = (page - 1) * pageSize;

        const commissions = await CommissionDistribution.findAll({
            where: { beneficiary_user_id: userId },
            order: [['created_at', 'DESC']],
            limit: pageSize, offset
        });

        const withdrawals = await PromoterWithdrawal.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            limit: pageSize, offset
        });

        const list = [
            ...commissions.map(c => ({
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

// POST /promoter/withdraw - Withdraw (uses new balance tables)
exports.withdraw = async (req, res) => {
    try {
        const userId = uidFromReq(req);
        if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
        const { amount } = req.body;

        if (!amount || Number(amount) <= 0) return res.status(400).json({ code: 1, msg: '提现金额需大于0' });

        const balances = await PartnerCommissionBalance.findAll({ where: { user_id: userId } });
        let totalAvailable = 0;
        balances.forEach(b => { totalAvailable += Number(b.available_amount); });

        if (Number(amount) > totalAvailable) return res.status(400).json({ code: 1, msg: '可提现金额不足' });

        const withdrawal = await PromoterWithdrawal.create({
            user_id: userId, amount: Number(amount), status: 'pending'
        });

        // Deduct from balances proportionally
        if (balances.length > 0) {
            const sequelize = PartnerCommissionBalance.sequelize;
            await sequelize.transaction(async (t) => {
                let remaining = Number(amount);
                for (const b of balances) {
                    const deduct = Math.min(Number(b.available_amount), remaining);
                    if (deduct > 0) {
                        await b.increment({ available_amount: -deduct, withdrawn_amount: deduct }, { transaction: t });
                        remaining -= deduct;
                        if (remaining <= 0) break;
                    }
                }
            });
        }

        res.json({ code: 0, msg: '提现申请已提交', data: withdrawal.toJSON() });
    } catch (error) {
        console.error('提现失败:', error);
        res.status(500).json({ code: 1, msg: '提现失败' });
    }
};

// GET /promoter/share-link - Get share link (unchanged)
exports.getShareLink = async (req, res) => {
    try {
        const { goods_id } = req.query;
        const userId = uidFromReq(req);
        if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });

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
