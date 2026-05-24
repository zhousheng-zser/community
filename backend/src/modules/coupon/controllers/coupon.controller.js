const { Op } = require('sequelize');
const { CouponTemplate, CouponIssue } = require('../../../models');
const couponService = require('../services/coupon.service');
const { resolveUserId, resolveUserIdFromReq } = require('../../../utils/resolveUserId');

async function attachReceiveStatus(userId, templates) {
  if (!userId || !templates.length) {
    return templates.map((t) => couponService.mapTemplateRow(t, { received: false }));
  }
  const ids = templates.map((t) => t.id);
  const issues = await CouponIssue.findAll({
    where: { user_id: userId, template_id: { [Op.in]: ids }, status: 'unused' },
    attributes: ['template_id']
  });
  const receivedSet = new Set(issues.map((i) => String(i.template_id)));
  return templates.map((t) => {
    const limit = Number(t.per_user_limit) || 1;
    const received = receivedSet.has(String(t.id));
    const remain = couponService.remainCount(t);
    const canReceive = !received
      && (remain == null || remain > 0)
      && couponService.isReceiveWindowOpen(t)
      && couponService.isValidPeriod(t);
    return couponService.mapTemplateRow(t, { received, can_receive: canReceive });
  });
}

function buildClaimableWhere() {
  const now = new Date();
  return {
    status: 'active',
    issue_mode: 'claim',
    [Op.and]: [
      { [Op.or]: [{ receive_from: null }, { receive_from: { [Op.lte]: now } }] },
      { [Op.or]: [{ receive_to: null }, { receive_to: { [Op.gte]: now } }] }
    ]
  };
}

// GET /coupons/home
exports.getHomeCoupons = async (req, res) => {
  try {
    await couponService.ensureCouponTables();
    const userId = resolveUserIdFromReq(req);
    const rows = await CouponTemplate.findAll({
      where: {
        ...buildClaimableWhere(),
        show_on_home: 1
      },
      order: [['home_sort', 'ASC'], ['created_at', 'DESC']],
      limit: 20
    });
    const list = await attachReceiveStatus(userId, rows);
    res.json({ code: 0, msg: 'ok', data: { list } });
  } catch (error) {
    console.error('[coupons/home]', error);
    res.status(500).json({ code: 1, msg: '获取首页优惠券失败' });
  }
};

// GET /coupons/list
exports.getCouponList = async (req, res) => {
  try {
    await couponService.ensureCouponTables();
    const userId = resolveUserIdFromReq(req);
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.page_size, 10) || 50;
    const offset = (page - 1) * pageSize;
    const result = await CouponTemplate.findAndCountAll({
      where: buildClaimableWhere(),
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset
    });
    const list = await attachReceiveStatus(userId, result.rows);
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
    if (template.issue_mode !== 'claim') {
      return res.status(400).json({ code: 1, msg: '该优惠券不可主动领取' });
    }
    if (!couponService.isReceiveWindowOpen(template)) {
      return res.status(400).json({ code: 1, msg: '不在领取时间范围内' });
    }
    if (!couponService.isValidPeriod(template)) {
      return res.status(400).json({ code: 1, msg: '优惠券已过期' });
    }
    const already = await CouponIssue.findOne({
      where: { template_id: coupon_id, user_id: userId, status: 'unused' }
    });
    if (already) return res.status(400).json({ code: 1, msg: '您已领取该优惠券' });
    const issue = await couponService.issueToUser(userId, coupon_id, { source: 'claim' });
    res.json({ code: 0, msg: '领取成功', data: { ...issue.toJSON(), coupon_id } });
  } catch (error) {
    console.error('[coupons/receive]', error);
    const status = error.statusCode || 500;
    res.status(status).json({ code: 1, msg: error.message || '领取优惠券失败' });
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
        attributes: ['id', 'name', 'type', 'discount_amount', 'threshold_amount', 'valid_to', 'valid_from', 'status', 'apply_scope']
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
        attributes: ['id', 'name', 'type', 'discount_amount', 'threshold_amount', 'valid_to', 'apply_scope']
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
      data: couponService.mapTemplateRow(template)
    });
  } catch (error) {
    console.error('[coupons/detail]', error);
    res.status(500).json({ code: 1, msg: '获取优惠券详情失败' });
  }
};

// GET /coupons/available-for-order?order_amount=100&from=service
exports.getAvailableCouponsForOrder = async (req, res) => {
  try {
    const userId = resolveUserIdFromReq(req);
    if (!userId) return res.status(401).json({ code: 1, msg: '未登录' });
    await couponService.ensureWelcomeCoupon(userId);
    const amount = parseFloat(req.query.order_amount) || 0;
    const orderType = String(req.query.from || req.query.order_type || '').toLowerCase();
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
        if (!couponService.isValidPeriod(tpl, now)) return false;
        if (Number(tpl.threshold_amount) > amount) return false;
        if (orderType && !couponService.matchesApplyScope(tpl, orderType)) return false;
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
