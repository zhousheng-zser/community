const { CouponTemplate, CouponIssue, User } = require('../models');

// GET /coupons/list - Get available coupon templates
exports.getCouponList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.page_size) || 50;
        const offset = (page - 1) * pageSize;

        const result = await CouponTemplate.findAndCountAll({
            where: { status: 'active' },
            order: [['created_at', 'DESC']],
            limit: pageSize, offset
        });

        const list = result.rows.map(t => ({
            id: t.id, name: t.name, coupon_name: t.name,
            type: t.type, coupon_money: t.discount_amount, discount_amount: t.discount_amount,
            threshold_amount: t.threshold_amount,
            total_count: t.total_count, issued_count: t.issued_count,
            end_time: t.valid_to, endTime: t.valid_to,
            status: t.status
        }));

        res.json({ code: 0, msg: 'ok', data: { list, total: result.count, page, page_size: pageSize } });
    } catch (error) {
        console.error('获取优惠券列表失败:', error);
        res.status(500).json({ code: 1, msg: '获取优惠券列表失败' });
    }
};

// POST /coupons/receive - Receive a coupon
exports.receiveCoupon = async (req, res) => {
    try {
        const { coupon_id } = req.body;
        const userId = req.user.id;

        if (!coupon_id) return res.status(400).json({ code: 1, msg: '需要 coupon_id' });

        const template = await CouponTemplate.findByPk(coupon_id);
        if (!template || template.status !== 'active') return res.status(404).json({ code: 1, msg: '优惠券不存在或已过期' });

        const now = new Date();
        if (template.valid_from && now < template.valid_from) return res.status(400).json({ code: 1, msg: '优惠券未开始发放' });
        if (template.valid_to && now > template.valid_to) return res.status(400).json({ code: 1, msg: '优惠券已过期' });

        const already = await CouponIssue.findOne({ where: { template_id: coupon_id, user_id: userId, status: 'unused' } });
        if (already) return res.status(400).json({ code: 1, msg: '您已领取该优惠券' });

        const code = 'CPN' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
        const issue = await CouponIssue.create({
            template_id: coupon_id, user_id: userId, code,
            status: 'unused', issued_at: now
        });
        await template.increment('issued_count');

        res.json({ code: 0, msg: '领取成功', data: { ...issue.toJSON(), coupon_id } });
    } catch (error) {
        console.error('领取优惠券失败:', error);
        res.status(500).json({ code: 1, msg: '领取优惠券失败' });
    }
};

// GET /coupons/my - Get my coupons
exports.getMyCoupons = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.page_size) || 50;
        const status = req.query.status;
        const offset = (page - 1) * pageSize;

        const where = { user_id: userId };
        if (status) where.status = status;

        const result = await CouponIssue.findAndCountAll({
            where,
            include: [{ model: CouponTemplate, as: 'CouponTemplate', attributes: ['id', 'name', 'type', 'discount_amount', 'threshold_amount'] }],
            order: [['created_at', 'DESC']],
            limit: pageSize, offset
        });

        const now = new Date();
        const list = result.rows.map(i => ({
            id: i.id, coupon_id: i.template_id, code: i.code,
            coupon_name: i.CouponTemplate && i.CouponTemplate.name,
            coupon_money: i.CouponTemplate && i.CouponTemplate.discount_amount,
            status: i.status, issued_at: i.issued_at, end_time: null,
            template: i.CouponTemplate
        }));

        res.json({ code: 0, msg: 'ok', data: { list, total: result.count, page, page_size: pageSize } });
    } catch (error) {
        console.error('获取我的优惠券失败:', error);
        res.status(500).json({ code: 1, msg: '获取我的优惠券失败' });
    }
};

// GET /coupons/:couponId - Get coupon detail
exports.getCouponDetail = async (req, res) => {
    try {
        const template = await CouponTemplate.findByPk(req.params.couponId);
        if (!template) return res.status(404).json({ code: 1, msg: '优惠券不存在' });

        res.json({ code: 0, msg: 'ok', data: {
            id: template.id, name: template.name, type: template.type,
            discount_amount: template.discount_amount, threshold_amount: template.threshold_amount,
            total_count: template.total_count, issued_count: template.issued_count,
            valid_from: template.valid_from, valid_to: template.valid_to, status: template.status
        }});
    } catch (error) {
        console.error('获取优惠券详情失败:', error);
        res.status(500).json({ code: 1, msg: '获取优惠券详情失败' });
    }
};

// GET /coupons/available-for-order - Get coupons usable for an order
exports.getAvailableCouponsForOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { order_amount, order_id } = req.query;
        const amount = parseFloat(order_amount) || 0;

        const issues = await CouponIssue.findAll({
            where: { user_id: userId, status: 'unused' },
            include: [{ model: CouponTemplate, as: 'CouponTemplate', where: { status: 'active' }, required: true }],
            order: [['CouponTemplate', 'discount_amount', 'DESC']]
        });

        const list = issues
            .filter(i => {
                const validTo = i.CouponTemplate.valid_to;
                if (validTo && new Date(validTo) < new Date()) return false;
                if (i.CouponTemplate.threshold_amount > amount) return false;
                return true;
            })
            .map(i => ({
                id: i.id, coupon_id: i.template_id,
                coupon_name: i.CouponTemplate.name,
                coupon_money: i.CouponTemplate.discount_amount,
                threshold_amount: i.CouponTemplate.threshold_amount
            }));

        res.json({ code: 0, msg: 'ok', data: { list } });
    } catch (error) {
        console.error('获取可用优惠券失败:', error);
        res.status(500).json({ code: 1, msg: '获取可用优惠券失败' });
    }
};
