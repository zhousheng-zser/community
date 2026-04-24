const { Op } = require('sequelize');
const { MarketOrder, MarketPayTransaction, MarketRefundOrder, MarketRefundLog } = require('../models');
const { logAdminAction } = require('./adminAuditHelper');

function genRefundNo() {
    const d = new Date();
    const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
    const rnd = Math.floor(Math.random() * 9000) + 1000;
    return `RF${ts}${rnd}`;
}

async function appendLog(refundNo, fromStatus, toStatus, operator, note) {
    await MarketRefundLog.create({ refund_no: refundNo, from_status: fromStatus || null, to_status: toStatus, operator: operator || 'admin', note: note || null });
}

exports.list = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = (page - 1) * limit;
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.order_no) where.order_no = { [Op.like]: `%${String(req.query.order_no).trim()}%` };
        const { rows, count } = await MarketRefundOrder.findAndCountAll({ where, offset, limit, order: [['created_at', 'DESC']] });
        res.json({ message: 'ok', total: count, page, limit, data: rows });
    } catch (e) {
        console.error('admin refund list:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.detail = async (req, res) => {
    try {
        const row = await MarketRefundOrder.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: '退款单不存在' });
        const logs = await MarketRefundLog.findAll({ where: { refund_no: row.refund_no }, order: [['created_at', 'ASC']] });
        const order = await MarketOrder.findOne({ where: { order_no: row.order_no } });
        res.json({ message: 'ok', data: { refund: row, logs, order } });
    } catch (e) {
        console.error('admin refund detail:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.apply = async (req, res) => {
    try {
        const { order_no, reason, refund_amount } = req.body || {};
        if (!order_no) return res.status(400).json({ error: '缺少 order_no' });
        const order = await MarketOrder.findOne({ where: { order_no } });
        if (!order) return res.status(404).json({ error: '订单不存在' });
        const amount = Number(refund_amount != null ? refund_amount : order.payable_amount || 0);
        if (Number.isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'refund_amount 无效' });
        const pay = await MarketPayTransaction.findOne({ where: { order_no }, order: [['created_at', 'DESC']] });
        const row = await MarketRefundOrder.create({
            refund_no: genRefundNo(),
            order_no,
            out_trade_no: pay ? pay.out_trade_no : null,
            reason: reason || '用户申请退款',
            refund_amount: amount,
            status: 'pending'
        });
        await appendLog(row.refund_no, null, 'pending', (req.admin && req.admin.sub) || 'admin', row.reason);
        await logAdminAction(req, 'refund_apply', 'market_refund', row.id, { order_no, amount });
        res.status(201).json({ message: '已创建退款单', data: row });
    } catch (e) {
        console.error('admin refund apply:', e);
        res.status(500).json({ error: '创建失败' });
    }
};

exports.review = async (req, res) => {
    try {
        const { action, note } = req.body || {};
        if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'action 须为 approve/reject' });
        const row = await MarketRefundOrder.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: '退款单不存在' });
        if (row.status !== 'pending') return res.status(400).json({ error: '仅 pending 可审核' });
        const from = row.status;
        row.status = action === 'approve' ? 'approved' : 'rejected';
        row.audit_note = note || null;
        row.reviewed_at = new Date();
        await row.save();
        await appendLog(row.refund_no, from, row.status, (req.admin && req.admin.sub) || 'admin', note);
        await logAdminAction(req, `refund_${action}`, 'market_refund', row.id, { note });
        res.json({ message: '审核成功', data: row });
    } catch (e) {
        console.error('admin refund review:', e);
        res.status(500).json({ error: '审核失败' });
    }
};

exports.execute = async (req, res) => {
    try {
        const { success = true, note } = req.body || {};
        const row = await MarketRefundOrder.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: '退款单不存在' });
        if (!['approved', 'processing'].includes(row.status)) return res.status(400).json({ error: '仅 approved/processing 可执行' });
        const from = row.status;
        row.status = success ? 'success' : 'failed';
        row.executed_at = new Date();
        await row.save();
        await appendLog(row.refund_no, from, row.status, (req.admin && req.admin.sub) || 'admin', note);
        if (success) {
            await MarketOrder.update(
                { pay_status: 'refunded', order_status: 'refunded' },
                { where: { order_no: row.order_no } }
            );
            await MarketPayTransaction.update({ pay_status: 'refunded' }, { where: { order_no: row.order_no } });
        }
        await logAdminAction(req, 'refund_execute', 'market_refund', row.id, { success, note });
        res.json({ message: '执行完成', data: row });
    } catch (e) {
        console.error('admin refund execute:', e);
        res.status(500).json({ error: '执行失败' });
    }
};

exports.exportCsv = async (req, res) => {
    try {
        const rows = await MarketRefundOrder.findAll({ order: [['created_at', 'DESC']], limit: 5000 });
        const header = 'refund_no,order_no,status,refund_amount,reason,created_at\n';
        const body = rows.map(r => [r.refund_no, r.order_no, r.status, Number(r.refund_amount || 0), (r.reason || '').replace(/,/g, ' '), r.created_at ? new Date(r.created_at).toISOString() : ''].join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=\"refunds.csv\"');
        res.send(`\uFEFF${header}${body}`);
    } catch (e) {
        console.error('admin refund export:', e);
        res.status(500).json({ error: '导出失败' });
    }
};
