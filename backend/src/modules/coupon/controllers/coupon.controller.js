const { CouponTemplate, CouponIssue } = require('../../../models');
const couponService = require('../services/coupon.service');
const { resolveUserId, resolveUserIdFromReq } = require('../../../utils/resolveUserId');

// GET /coupons/list
exports.getCouponList = async (req, res) => {
  try {
    await couponService.ensureCouponTables();
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.page_size, 10) || 50;
    const offset = (page - 1) * pageSize;
    const result = await CouponTemplate.findAndCountAll({
      where: { status: 'active' },
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset
    });
    const list = result.rows.map((t) => ({
      id: t.id,
      name: t.name,
      coupon_name: t.name,
      type: t.type,
      coupon_money: t.discount_amount,
      discount_amount: t.discount_amount,
      threshold_amount: t.threshold_amount,
      total_count: t.total_count,
      issued_count: t.issued_count,
      end_time: t.valid_to,
      endTime: t.valid_to,
      status: t.status
    }));
    res.json({ code: 0, msg: 'ok', data: { list, total: result.count, page, page_size: pageSize } });
  } catch (error) {
    console.error('[coupons/list]', error);
    res.status(500).json({ code: 1, msg: '获取优惠券列表失败' });
  }
};

// POST /coupons/receive
exports.receiveCoupon = async (req, res) => {
  try {
    await couponService.ensureCouponTables();
    const { coupon_id } = req.body;
    const userId = resolveUserIdFromReq(req);
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    if (!coupon_id) return res.status(400).json({ code: 1, msg: '需要 coupon_id' });
    const template = await CouponTemplate.findByPk(coupon_id);
    if (!template || template.status !== 'active') {
      return res.status(404).json({ code: 1, msg: '优惠券不存在或已过期' });
    }
    const now = new Date();
    if (template.valid_from && now < template.valid_from) {
      return res.status(400).json({ code: 1, msg: '优惠券未开始发放' });
    }
    if (template.valid_to && now > template.valid_to) {
      return res.status(400).json({ code: 1, msg: '优惠券已过期' });
    }
    const already = await CouponIssue.findOne({
      where: { template_id: coupon_id, user_id: userId, status: 'unused' }
    });
    if (already) return res.status(400).json({ code: 1, msg: '您已领取该优惠券' });
    const code = 'CPN' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    const issue = await CouponIssue.create({
      template_id: coupon_id,
      user_id: userId,
      code,
      status: 'unused',
      issued_at: now
    });
    await template.increment('issued_count');
    res.json({ code: 0, msg: '领取成功', data: { ...issue.toJSON(), coupon_id } });
  } catch (error) {
    console.error('[coupons/receive]', error);
    res.status(500).json({ code: 1, msg: '领取优惠券失败' });
  }
};

// GET /coupons/my
exports.getMyCoupons = async (req, res) => {
  try {
    const userId = resolveUserIdFromReq(req);
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    await couponService.ensureWelcomeCoupon(userId);
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.page_size, 10) || 50;
    const status = req.query.status;
    const offset = (page - 1) * pageSize;
    const where = { user_id: userId };
    if (status) where.status = status;
    const result = await CouponIssue.findAndCountAll({
      where,
      include: [{
        model: CouponTemplate,
        as: 'CouponTemplate',
        attributes: ['id', 'name', 'type', 'discount_amount', 'threshold_amount', 'valid_to', 'valid_from', 'status']
      }],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset
    });
    const now = new Date();
    const list = result.rows.map((i) => {
      const row = couponService.mapIssueRow(i);
      if (row.status === 'unused' && row.end_time && new Date(row.end_time) < now) {
        row.status = 'expired';
      }
      return row;
    });
    res.json({ code: 0, msg: 'ok', data: { list, total: result.count, page, page_size: pageSize } });
  } catch (error) {
    console.error('[coupons/my]', error);
    res.status(500).json({ code: 1, msg: '获取我的优惠券失败' });
  }
};

/** GET /wx/user/coupon/:id 兼容旧小程序 */
exports.getMyCouponsLegacy = async (req, res) => {
  try {
    const userId = resolveUserIdFromReq(req);
    const paramId = resolveUserId(req.params.id);
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    if (paramId && paramId !== userId) {
      return res.status(403).json({ code: 1, msg: '无权查看' });
    }
    await couponService.ensureWelcomeCoupon(userId);
    const issues = await CouponIssue.findAll({
      where: { user_id: userId },
      include: [{
        model: CouponTemplate,
        as: 'CouponTemplate',
        attributes: ['id', 'name', 'type', 'discount_amount', 'threshold_amount', 'valid_to']
      }],
      order: [['created_at', 'DESC']],
      limit: 100
    });
    const list = issues.map((i) => couponService.mapIssueRow(i));
    res.json({ code: 0, msg: 'ok', data: list });
  } catch (error) {
    console.error('[wx/user/coupon]', error);
    res.status(500).json({ code: 1, msg: '获取优惠券失败' });
  }
};

// GET /coupons/:couponId
exports.getCouponDetail = async (req, res) => {
  try {
    const template = await CouponTemplate.findByPk(req.params.couponId);
    if (!template) return res.status(404).json({ code: 1, msg: '优惠券不存在' });
    res.json({
      code: 0,
      msg: 'ok',
      data: {
        id: template.id,
        name: template.name,
        type: template.type,
        discount_amount: template.discount_amount,
        threshold_amount: template.threshold_amount,
        total_count: template.total_count,
        issued_count: template.issued_count,
        valid_from: template.valid_from,
        valid_to: template.valid_to,
        status: template.status
      }
    });
  } catch (error) {
    console.error('[coupons/detail]', error);
    res.status(500).json({ code: 1, msg: '获取优惠券详情失败' });
  }
};

// GET /coupons/available-for-order?order_amount=100
exports.getAvailableCouponsForOrder = async (req, res) => {
  try {
    const userId = resolveUserIdFromReq(req);
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    await couponService.ensureWelcomeCoupon(userId);
    const amount = parseFloat(req.query.order_amount) || 0;
    const issues = await CouponIssue.findAll({
      where: { user_id: userId, status: 'unused' },
      include: [{
        model: CouponTemplate,
        as: 'CouponTemplate',
        where: { status: 'active' },
        required: true
      }],
      order: [[{ model: CouponTemplate, as: 'CouponTemplate' }, 'discount_amount', 'DESC']]
    });
    const now = new Date();
    const list = issues
      .filter((i) => {
        const tpl = i.CouponTemplate;
        if (tpl.valid_to && new Date(tpl.valid_to) < now) return false;
        if (tpl.valid_from && new Date(tpl.valid_from) > now) return false;
        if (Number(tpl.threshold_amount) > amount) return false;
        return true;
      })
      .map((i) => {
        const row = couponService.mapIssueRow(i);
        row.can_use = true;
        return row;
      });
    res.json({ code: 0, msg: 'ok', data: { list } });
  } catch (error) {
    console.error('[coupons/available-for-order]', error);
    res.status(500).json({ code: 1, msg: '获取可用优惠券失败' });
  }
};
