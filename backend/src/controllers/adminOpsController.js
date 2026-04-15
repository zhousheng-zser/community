const { Op } = require('sequelize');
const {
    CouponTemplate,
    CouponIssue,
    Activity,
    Feedback,
    User,
    MarketOrder,
    MarketRefundOrder
} = require('../models');
const { logAdminAction } = require('./adminAuditHelper');

function genCouponCode() {
    return `CP${Date.now()}${Math.floor(Math.random() * 90000 + 10000)}`;
}

exports.listCouponTemplates = async (_req, res) => {
    try {
        const rows = await CouponTemplate.findAll({ order: [['created_at', 'DESC']], limit: 500 });
        res.json({ message: 'ok', data: rows });
    } catch (e) {
        console.error('admin listCouponTemplates:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.createCouponTemplate = async (req, res) => {
    try {
        const b = req.body || {};
        if (!b.name) return res.status(400).json({ error: 'name 必填' });
        const row = await CouponTemplate.create({
            name: b.name,
            type: b.type || 'cash',
            threshold_amount: b.threshold_amount || 0,
            discount_amount: b.discount_amount || 0,
            total_count: b.total_count || 0,
            valid_from: b.valid_from || null,
            valid_to: b.valid_to || null,
            status: b.status || 'active'
        });
        await logAdminAction(req, 'create_coupon_template', 'coupon_template', row.id, b);
        res.status(201).json({ message: '创建成功', data: row });
    } catch (e) {
        console.error('admin createCouponTemplate:', e);
        res.status(500).json({ error: '创建失败' });
    }
};

exports.issueCoupon = async (req, res) => {
    try {
        const { template_id, user_ids } = req.body || {};
        if (!template_id || !Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({ error: 'template_id 与 user_ids 必填' });
        }
        const template = await CouponTemplate.findByPk(template_id);
        if (!template) return res.status(404).json({ error: '模板不存在' });
        const payload = user_ids.map(uid => ({
            template_id,
            user_id: uid,
            code: genCouponCode(),
            status: 'unused',
            issued_at: new Date()
        }));
        await CouponIssue.bulkCreate(payload);
        template.issued_count = Number(template.issued_count || 0) + payload.length;
        await template.save();
        await logAdminAction(req, 'issue_coupon', 'coupon_template', template_id, { count: payload.length });
        res.json({ message: '发放成功', data: { count: payload.length } });
    } catch (e) {
        console.error('admin issueCoupon:', e);
        res.status(500).json({ error: '发放失败' });
    }
};

exports.listCouponIssues = async (req, res) => {
    try {
        const where = {};
        if (req.query.template_id) where.template_id = req.query.template_id;
        if (req.query.status) where.status = req.query.status;
        const rows = await CouponIssue.findAll({ where, order: [['created_at', 'DESC']], limit: 2000 });
        res.json({ message: 'ok', data: rows });
    } catch (e) {
        console.error('admin listCouponIssues:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.listActivities = async (_req, res) => {
    try {
        const rows = await Activity.findAll({ order: [['created_at', 'DESC']], limit: 200 });
        res.json({ message: 'ok', data: rows });
    } catch (e) {
        console.error('admin listActivities:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.createActivity = async (req, res) => {
    try {
        const b = req.body || {};
        if (!b.title) return res.status(400).json({ error: 'title 必填' });
        const row = await Activity.create({
            title: b.title,
            description: b.description || null,
            start_time: b.start_time || null,
            end_time: b.end_time || null,
            status: b.status || 'active'
        });
        await logAdminAction(req, 'create_activity', 'activity', row.id);
        res.status(201).json({ message: '创建成功', data: row });
    } catch (e) {
        console.error('admin createActivity:', e);
        res.status(500).json({ error: '创建失败' });
    }
};

exports.dataReport = async (req, res) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : null;
        const to = req.query.to ? new Date(req.query.to) : null;
        const where = {};
        if (from || to) {
            where.created_at = {};
            if (from) where.created_at[Op.gte] = from;
            if (to) where.created_at[Op.lte] = to;
        }
        const [users, orders, paidAmount, refunds, feedbacks] = await Promise.all([
            User.count(),
            MarketOrder.count({ where }),
            MarketOrder.sum('payable_amount', { where: { ...where, pay_status: 'paid' } }),
            MarketRefundOrder.sum('refund_amount', { where: { ...where, status: 'success' } }),
            Feedback.count({ where })
        ]);
        const paid = Number(paidAmount || 0);
        const refund = Number(refunds || 0);
        res.json({
            message: 'ok',
            data: {
                users_total: users,
                orders_total: orders,
                paid_amount: paid,
                refund_amount: refund,
                net_amount: Number((paid - refund).toFixed(2)),
                feedback_total: feedbacks
            }
        });
    } catch (e) {
        console.error('admin dataReport:', e);
        res.status(500).json({ error: '统计失败' });
    }
};
