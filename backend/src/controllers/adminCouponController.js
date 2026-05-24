const { Op } = require('sequelize');
const db = require('../models');
const { CouponTemplate, CouponIssue } = db;
const couponService = require('../modules/coupon/services/coupon.service');
const { resolveUserId } = require('../utils/resolveUserId');

function pickTemplateFields(body) {
  const fields = {};
  const map = {
    code: 'code',
    name: 'name',
    type: 'type',
    discount_amount: 'discount_amount',
    threshold_amount: 'threshold_amount',
    total_count: 'total_count',
    valid_from: 'valid_from',
    valid_to: 'valid_to',
    status: 'status',
    issue_mode: 'issue_mode',
    per_user_limit: 'per_user_limit',
    receive_from: 'receive_from',
    receive_to: 'receive_to',
    apply_scope: 'apply_scope',
    show_on_home: 'show_on_home',
    home_sort: 'home_sort',
    description: 'description',
    is_new_user: 'is_new_user'
  };
  Object.keys(map).forEach((k) => {
    if (body[k] !== undefined) fields[map[k]] = body[k];
  });
  if (fields.show_on_home != null) fields.show_on_home = fields.show_on_home ? 1 : 0;
  if (fields.is_new_user != null) fields.is_new_user = fields.is_new_user ? 1 : 0;
  return fields;
}

exports.listCouponTemplates = async (req, res) => {
  try {
    await couponService.ensureCouponTables();
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = Math.min(parseInt(req.query.page_size, 10) || 20, 100);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.issue_mode) where.issue_mode = req.query.issue_mode;
    const result = await CouponTemplate.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
    res.json({
      code: 0,
      msg: 'ok',
      data: {
        list: result.rows.map((t) => couponService.mapTemplateRow(t)),
        total: result.count,
        page,
        page_size: pageSize
      }
    });
  } catch (e) {
    console.error('[admin/coupon-templates/list]', e);
    res.status(500).json({ code: 1, msg: '加载失败' });
  }
};

exports.createCouponTemplate = async (req, res) => {
  try {
    await couponService.ensureCouponTables();
    const body = req.body || {};
    if (!body.name) return res.status(400).json({ code: 1, msg: '需要 name' });
    const code = String(body.code || '').trim() || ('CPNT' + Date.now());
    const dup = await CouponTemplate.findOne({ where: { code } });
    if (dup) return res.status(400).json({ code: 1, msg: '编码已存在' });
    const row = await CouponTemplate.create({
      code,
      name: body.name,
      type: body.type || 'amount',
      discount_amount: body.discount_amount != null ? body.discount_amount : 0,
      threshold_amount: body.threshold_amount != null ? body.threshold_amount : 0,
      total_count: body.total_count != null ? body.total_count : 0,
      issued_count: 0,
      valid_from: body.valid_from || new Date(),
      valid_to: body.valid_to || null,
      status: body.status || 'active',
      issue_mode: body.issue_mode || 'claim',
      per_user_limit: body.per_user_limit != null ? body.per_user_limit : 1,
      receive_from: body.receive_from || null,
      receive_to: body.receive_to || null,
      apply_scope: body.apply_scope || 'all',
      show_on_home: body.show_on_home ? 1 : 0,
      home_sort: body.home_sort != null ? body.home_sort : 0,
      description: body.description || '',
      is_new_user: body.is_new_user ? 1 : 0
    });
    res.json({ code: 0, msg: '创建成功', data: couponService.mapTemplateRow(row) });
  } catch (e) {
    console.error('[admin/coupon-templates/create]', e);
    res.status(500).json({ code: 1, msg: '创建失败' });
  }
};

exports.updateCouponTemplate = async (req, res) => {
  try {
    await couponService.ensureCouponTables();
    const row = await CouponTemplate.findByPk(req.params.id);
    if (!row) return res.status(404).json({ code: 1, msg: '模板不存在' });
    const patch = pickTemplateFields(req.body || {});
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ code: 1, msg: '无更新字段' });
    }
    await row.update(patch);
    res.json({ code: 0, msg: '更新成功', data: couponService.mapTemplateRow(row) });
  } catch (e) {
    console.error('[admin/coupon-templates/update]', e);
    res.status(500).json({ code: 1, msg: '更新失败' });
  }
};

exports.listCouponIssues = async (req, res) => {
  try {
    await couponService.ensureCouponTables();
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = Math.min(parseInt(req.query.page_size, 10) || 20, 100);
    const where = {};
    if (req.query.user_id) where.user_id = resolveUserId(req.query.user_id);
    if (req.query.template_id) where.template_id = Number(req.query.template_id);
    if (req.query.status) where.status = req.query.status;
    const result = await CouponIssue.findAndCountAll({
      where,
      include: [{
        model: CouponTemplate,
        as: 'CouponTemplate',
        attributes: ['id', 'name', 'discount_amount', 'threshold_amount']
      }],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
    res.json({
      code: 0,
      msg: 'ok',
      data: {
        list: result.rows.map((i) => ({
          ...couponService.mapIssueRow(i),
          user_id: i.user_id,
          issue_source: i.issue_source,
          used_at: i.used_at,
          order_type: i.order_type,
          order_ref: i.order_ref
        })),
        total: result.count,
        page,
        page_size: pageSize
      }
    });
  } catch (e) {
    console.error('[admin/coupon-issues/list]', e);
    res.status(500).json({ code: 1, msg: '加载失败' });
  }
};

exports.issueCoupon = async (req, res) => {
  try {
    const body = req.body || {};
    const templateId = Number(body.template_id || body.coupon_id || 0);
    const userId = resolveUserId(body.user_id);
    if (!templateId || !userId) {
      return res.status(400).json({ code: 1, msg: '需要 template_id 与 user_id' });
    }
    const issue = await couponService.issueToUser(userId, templateId, { source: 'admin' });
    res.json({ code: 0, msg: '发放成功', data: issue });
  } catch (e) {
    console.error('[admin/coupon-issues/issue]', e);
    res.status(e.statusCode || 500).json({ code: 1, msg: e.message || '发放失败' });
  }
};

exports.batchIssueAll = async (req, res) => {
  try {
    const templateId = Number((req.body || {}).template_id || 0);
    if (!templateId) return res.status(400).json({ code: 1, msg: '需要 template_id' });
    const stats = await couponService.batchIssueAllUsers(templateId);
    res.json({ code: 0, msg: '批量发放完成', data: stats });
  } catch (e) {
    console.error('[admin/coupon-issues/batch-all]', e);
    res.status(e.statusCode || 500).json({ code: 1, msg: e.message || '批量发放失败' });
  }
};

exports.batchIssueUsers = async (req, res) => {
  try {
    const body = req.body || {};
    const templateId = Number(body.template_id || 0);
    const userIds = Array.isArray(body.user_ids) ? body.user_ids : [];
    if (!templateId || !userIds.length) {
      return res.status(400).json({ code: 1, msg: '需要 template_id 与 user_ids' });
    }
    const stats = await couponService.batchIssueToUsers(templateId, userIds, 'admin_batch');
    res.json({ code: 0, msg: '批量发放完成', data: stats });
  } catch (e) {
    console.error('[admin/coupon-issues/batch-users]', e);
    res.status(e.statusCode || 500).json({ code: 1, msg: e.message || '批量发放失败' });
  }
};
