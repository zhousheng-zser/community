const { Op } = require('sequelize');
const db = require('../../../models');
const { CouponTemplate, CouponIssue } = db;

const WELCOME_TEMPLATE_CODE = 'WELCOME_100_20';
const LEGACY_WELCOME_CODES = ['WELCOME_100_10', 'WELCOME_100_20'];

let tablesReady = false;

async function ensureCouponTables() {
  if (tablesReady) return;
  await Promise.all([
    CouponTemplate && CouponTemplate.sync ? CouponTemplate.sync() : Promise.resolve(),
    CouponIssue && CouponIssue.sync ? CouponIssue.sync() : Promise.resolve()
  ]);
  tablesReady = true;
}

async function getOrCreateWelcomeTemplate(transaction) {
  const opts = transaction ? { transaction } : {};
  let tpl = await CouponTemplate.findOne({ where: { code: WELCOME_TEMPLATE_CODE }, ...opts });
  if (!tpl) {
    const now = new Date();
    const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    tpl = await CouponTemplate.create({
      code: WELCOME_TEMPLATE_CODE,
      name: '满100减20新人券',
      type: 'amount',
      discount_amount: 20,
      threshold_amount: 100,
      total_count: 0,
      issued_count: 0,
      valid_from: now,
      valid_to: nextYear,
      status: 'active'
    }, opts);
  }
  return tpl;
}

/** 新用户首次进入时发放默认满100减20券（每用户一张） */
async function ensureWelcomeCoupon(userId) {
  if (!userId || !CouponTemplate || !CouponIssue) return null;
  await ensureCouponTables();
  const tpl = await getOrCreateWelcomeTemplate();
  // 兼容旧模板编码：已有任意新人券则不再重复发放
  const legacyTpls = await CouponTemplate.findAll({
    where: { code: LEGACY_WELCOME_CODES }
  });
  const legacyIds = legacyTpls.map((t) => t.id);
  if (legacyIds.length) {
    const existingAny = await CouponIssue.findOne({
      where: { user_id: userId, template_id: { [Op.in]: legacyIds } }
    });
    if (existingAny) return existingAny;
  }
  const existing = await CouponIssue.findOne({
    where: { user_id: userId, template_id: tpl.id }
  });
  if (existing) return existing;
  const code = 'CPN' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
  const issue = await CouponIssue.create({
    template_id: tpl.id,
    user_id: userId,
    code,
    status: 'unused',
    issued_at: new Date()
  });
  await tpl.increment('issued_count');
  return issue;
}

function mapIssueRow(i) {
  const tpl = i.CouponTemplate || {};
  const validTo = tpl.valid_to || null;
  return {
    id: i.id,
    coupon_id: i.template_id,
    code: i.code,
    coupon_name: tpl.name || '',
    coupon_money: tpl.discount_amount != null ? Number(tpl.discount_amount) : 0,
    discount_amount: tpl.discount_amount != null ? Number(tpl.discount_amount) : 0,
    threshold_amount: tpl.threshold_amount != null ? Number(tpl.threshold_amount) : 0,
    status: i.status,
    issued_at: i.issued_at,
    end_time: validTo,
    endTime: validTo,
    template: tpl
  };
}

async function validateCouponForOrder(userId, couponIssueId, orderAmount, transaction) {
  if (!couponIssueId) {
    return { discount: 0, issue: null, template: null, goodsAmount: orderAmount, payableAmount: orderAmount };
  }
  await ensureCouponTables();
  const amount = Number(orderAmount) || 0;
  const issue = await CouponIssue.findOne({
    where: { id: couponIssueId, user_id: userId, status: 'unused' },
    include: [{ model: CouponTemplate, as: 'CouponTemplate', required: true }],
    transaction
  });
  if (!issue || !issue.CouponTemplate) {
    const err = new Error('优惠券不可用或已使用');
    err.statusCode = 400;
    throw err;
  }
  const tpl = issue.CouponTemplate;
  if (tpl.status !== 'active') {
    const err = new Error('优惠券已失效');
    err.statusCode = 400;
    throw err;
  }
  const now = new Date();
  if (tpl.valid_from && now < new Date(tpl.valid_from)) {
    const err = new Error('优惠券未到使用时间');
    err.statusCode = 400;
    throw err;
  }
  if (tpl.valid_to && now > new Date(tpl.valid_to)) {
    const err = new Error('优惠券已过期');
    err.statusCode = 400;
    throw err;
  }
  const threshold = Number(tpl.threshold_amount) || 0;
  if (amount < threshold) {
    const err = new Error(`订单满${threshold}元才可使用该券`);
    err.statusCode = 400;
    throw err;
  }
  const discount = Math.min(Number(tpl.discount_amount) || 0, amount);
  const payableAmount = Math.max(Number((amount - discount).toFixed(2)), 0);
  return { discount, issue, template: tpl, goodsAmount: amount, payableAmount };
}

async function markCouponUsed(issueId, orderType, orderRef, transaction) {
  if (!issueId) return;
  await CouponIssue.update(
    {
      status: 'used',
      used_at: new Date(),
      order_type: orderType || null,
      order_ref: orderRef != null ? String(orderRef) : null
    },
    { where: { id: issueId, status: 'unused' }, transaction }
  );
}

async function releaseCouponByOrder(orderType, orderRef, transaction) {
  if (!orderRef) return;
  await CouponIssue.update(
    { status: 'unused', used_at: null, order_type: null, order_ref: null },
    {
      where: { order_type: orderType, order_ref: String(orderRef), status: 'used' },
      transaction
    }
  );
}

module.exports = {
  WELCOME_TEMPLATE_CODE,
  ensureCouponTables,
  ensureWelcomeCoupon,
  mapIssueRow,
  validateCouponForOrder,
  markCouponUsed,
  releaseCouponByOrder
};
