'use strict';

/**
 * 订单积分：实付 1 元 = 10 积分（例：25.2 元 → 252 分）。
 * 退款成功时扣回该笔订单已发放的积分（以订单上 points_earned 为准，避免重复扣/发）。
 */

const db = require('../models');

function payAmountToPoints(amount) {
const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 10);
}

function resolveOrderPayAmount(row) {
  if (!row) return 0;
  if (row.payable_amount != null) return row.payable_amount;
  if (row.pay_amount != null) return row.pay_amount;
  if (row.amount != null) return row.amount;
  return 0;
}

async function incrementUserPoints(userId, delta, transaction) {
  if (!delta || delta < 1) return 0;
  const User = db.User;
  if (!User) {
    console.warn('[orderPoints] User 模型未加载，跳过发放积分');
    return 0;
  }
  const uid = userId != null && userId !== '' ? String(userId) : '';
  if (!uid) return 0;
  const opts = transaction ? { transaction } : {};
  const user = await User.findByPk(uid, opts);
  if (!user) return 0;
  await user.increment('points', { by: delta, ...opts });
  return delta;
}

async function decrementUserPointsClamped(userId, delta, transaction) {
  if (!delta || delta < 1) return 0;
  const User = db.User;
  if (!User) {
    console.warn('[orderPoints] User 模型未加载，跳过扣减积分');
    return 0;
  }
  const uid = userId != null && userId !== '' ? String(userId) : '';
  if (!uid) return 0;
  const opts = transaction ? { transaction } : {};
  const user = await User.findByPk(uid, opts);
  if (!user) return 0;
  const cur = Number(user.points || 0);
  const sub = Math.min(delta, Math.max(0, cur));
  if (sub < 1) return 0;
  await user.decrement('points', { by: sub, ...opts });
  return sub;
}

/**
 * 支付成功后发放积分，并写入订单 points_earned（幂等：已有 points_earned > 0 则跳过）
 */
async function grantPointsOnOrderPaid(Model, row, transaction = null) {
  if (!Model || !row || row.id == null) return 0;
  const existing = Number(row.points_earned || 0);
  if (existing > 0) return 0;
  const pts = payAmountToPoints(resolveOrderPayAmount(row));
  if (pts < 1) return 0;
  const uid = row.user_id != null && row.user_id !== '' ? String(row.user_id) : '';
  const added = await incrementUserPoints(uid, pts, transaction);
  if (added < 1) return 0;
  const opts = transaction ? { transaction } : {};
  await Model.update({ points_earned: pts }, { where: { id: row.id }, ...opts });
  return pts;
}

/**
 * 退款成功：扣回该订单已发积分，并清零 points_earned
 */
async function revokePointsOnOrderRefund(Model, row, transaction = null) {
  if (!Model || !row || row.id == null) return 0;
  const pts = Number(row.points_earned || 0);
  if (pts < 1) return 0;
  const uid = row.user_id != null && row.user_id !== '' ? String(row.user_id) : '';
  await decrementUserPointsClamped(uid, pts, transaction);
  const opts = transaction ? { transaction } : {};
  await Model.update({ points_earned: 0 }, { where: { id: row.id }, ...opts });
  return pts;
}

module.exports = {
  payAmountToPoints,
  resolveOrderPayAmount,
  grantPointsOnOrderPaid,
  revokePointsOnOrderRefund
};
