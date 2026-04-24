const { Op } = require('sequelize');
const {
    User,
    MarketOrder,
    WorkerApplication,
    MarketApplication,
    MarketShop,
    MarketGood,
    MarketPayTransaction
} = require('../models');

function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function startOfDaysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
}

exports.overview = async (req, res) => {
    try {
        const t0 = startOfToday();
        const t7 = startOfDaysAgo(7);
        const [
            users_total,
            shops_total,
            goods_on_sale,
            orders_today,
            revenue_row,
            pending_worker_apps,
            pending_market_apps,
            payments_success_today,
            revenue_7d_row,
            orders_7d,
            users_new_7d
        ] = await Promise.all([
            User.count(),
            MarketShop.count({ where: { is_active: 1 } }),
            MarketGood.count({ where: { status: 'on_sale' } }),
            MarketOrder.count({ where: { created_at: { [Op.gte]: t0 } } }),
            MarketOrder.sum('payable_amount', {
                where: {
                    created_at: { [Op.gte]: t0 },
                    pay_status: 'paid'
                }
            }),
            WorkerApplication.count({ where: { status: 'pending' } }),
            MarketApplication.count({ where: { status: 'pending' } }),
            MarketPayTransaction.count({
                where: {
                    pay_status: 'success',
                    created_at: { [Op.gte]: t0 }
                }
            }),
            MarketOrder.sum('payable_amount', {
                where: {
                    created_at: { [Op.gte]: t7 },
                    pay_status: 'paid'
                }
            }),
            MarketOrder.count({ where: { created_at: { [Op.gte]: t7 } } }),
            User.count({ where: { createdAt: { [Op.gte]: t7 } } })
        ]);

        const revenue_today = Number(revenue_row || 0);
        const revenue_7d = Number(revenue_7d_row || 0);

        res.json({
            message: 'ok',
            data: {
                users_total,
                shops_total,
                goods_on_sale,
                orders_today,
                revenue_today,
                pending_worker_apps,
                pending_market_apps,
                payments_success_today,
                revenue_7d,
                orders_7d,
                users_new_7d
            }
        });
    } catch (e) {
        console.error('admin stats overview:', e);
        res.status(500).json({ error: '统计失败' });
    }
};
