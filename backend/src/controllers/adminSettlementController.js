const { Op, fn, col } = require('sequelize');
const { MarketOrder, MarketRefundOrder } = require('../models');

exports.reconcileSummary = async (req, res) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : null;
        const to = req.query.to ? new Date(req.query.to) : null;
        const orderWhere = {};
        const refundWhere = {};
        if (from || to) {
            orderWhere.created_at = {};
            refundWhere.created_at = {};
            if (from) {
                orderWhere.created_at[Op.gte] = from;
                refundWhere.created_at[Op.gte] = from;
            }
            if (to) {
                orderWhere.created_at[Op.lte] = to;
                refundWhere.created_at[Op.lte] = to;
            }
        }
        const [orderCount, paidAmount, refundAmount, refundCount] = await Promise.all([
            MarketOrder.count({ where: orderWhere }),
            MarketOrder.sum('payable_amount', { where: { ...orderWhere, pay_status: 'paid' } }),
            MarketRefundOrder.sum('refund_amount', { where: { ...refundWhere, status: 'success' } }),
            MarketRefundOrder.count({ where: { ...refundWhere, status: 'success' } })
        ]);
        const gross = Number(paidAmount || 0);
        const refund = Number(refundAmount || 0);
        res.json({
            message: 'ok',
            data: {
                order_count: orderCount,
                paid_amount: gross,
                refund_count: refundCount,
                refund_amount: refund,
                net_amount: Number((gross - refund).toFixed(2))
            }
        });
    } catch (e) {
        console.error('admin reconcileSummary:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.listSettlementBills = async (req, res) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : null;
        const to = req.query.to ? new Date(req.query.to) : null;
        const where = { pay_status: { [Op.in]: ['paid', 'refunded'] } };
        if (from || to) {
            where.created_at = {};
            if (from) where.created_at[Op.gte] = from;
            if (to) where.created_at[Op.lte] = to;
        }
        const rows = await MarketOrder.findAll({
            attributes: ['shop_id', [fn('COUNT', col('id')), 'order_count'], [fn('SUM', col('payable_amount')), 'payable_sum']],
            where,
            group: ['shop_id'],
            order: [['shop_id', 'ASC']]
        });
        res.json({ message: 'ok', data: rows });
    } catch (e) {
        console.error('admin listSettlementBills:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.generateSettlement = async (req, res) => {
    try {
        const { from, to, service_rate = 0.05 } = req.body || {};
        const start = from ? new Date(from) : null;
        const end = to ? new Date(to) : null;
        const where = { pay_status: { [Op.in]: ['paid', 'refunded'] } };
        if (start || end) {
            where.created_at = {};
            if (start) where.created_at[Op.gte] = start;
            if (end) where.created_at[Op.lte] = end;
        }
        const grouped = await MarketOrder.findAll({
            attributes: ['shop_id', [fn('COUNT', col('id')), 'order_count'], [fn('SUM', col('payable_amount')), 'gross']],
            where,
            group: ['shop_id'],
            raw: true
        });
        const rows = grouped.map(g => {
            const gross = Number(g.gross || 0);
            const fee = Number((gross * Number(service_rate || 0)).toFixed(2));
            return {
                shop_id: g.shop_id,
                order_count: Number(g.order_count || 0),
                gross_amount: gross,
                service_fee: fee,
                net_amount: Number((gross - fee).toFixed(2))
            };
        });
        res.json({ message: '生成成功', data: { from, to, service_rate, rows } });
    } catch (e) {
        console.error('admin generateSettlement:', e);
        res.status(500).json({ error: '生成失败' });
    }
};

exports.exportSettlementCsv = async (req, res) => {
    try {
        const rows = await MarketOrder.findAll({
            attributes: ['shop_id', [fn('COUNT', col('id')), 'order_count'], [fn('SUM', col('payable_amount')), 'gross']],
            where: { pay_status: { [Op.in]: ['paid', 'refunded'] } },
            group: ['shop_id'],
            raw: true
        });
        const header = 'shop_id,order_count,gross_amount\n';
        const body = rows.map(r => [r.shop_id, Number(r.order_count || 0), Number(r.gross || 0)].join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=\"settlement.csv\"');
        res.send(`\uFEFF${header}${body}`);
    } catch (e) {
        console.error('admin exportSettlementCsv:', e);
        res.status(500).json({ error: '导出失败' });
    }
};
