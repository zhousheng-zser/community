/**
 * Commission Controller
 * Handles commission config, balance, records, distribution webhook
 */
const commissionService = require('../services/commission.service');
const {
  CommissionDistribution,
  PartnerCommissionBalance,
  PartnerRole,
  PartnerRelation,
  PromoterWithdrawal
} = require('../../../models');
const { Op } = require('sequelize');

// GET /commission/config - Get commission rate configuration (public)
exports.getConfig = async (req, res) => {
  try {
    const rates = await commissionService.getCommissionRates();
    res.json({ code: 0, msg: 'ok', data: rates });
  } catch (error) {
    console.error('获取佣金配置失败:', error);
    res.status(500).json({ code: 1, msg: '获取佣金配置失败' });
  }
};

// GET /commission/my - Get current user's commission balance across all roles
exports.getMyBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = await commissionService.getUserBalance(userId);
    res.json({ code: 0, msg: 'ok', data: summary });
  } catch (error) {
    console.error('获取佣金余额失败:', error);
    res.status(500).json({ code: 1, msg: '获取佣金余额失败' });
  }
};

// GET /commission/my/records - Get paginated commission records for current user
exports.getMyRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.page_size) || 20;
    const status = req.query.status;
    const offset = (page - 1) * pageSize;

    const where = { beneficiary_user_id: userId };
    if (status) where.status = status;

    const result = await CommissionDistribution.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset
    });

    const list = result.rows.map(d => ({
      id: d.id,
      order_id: d.order_id,
      order_type: d.order_type,
      order_amount: Number(d.order_amount),
      commission_pool: Number(d.commission_pool),
      beneficiary_role: d.beneficiary_role,
      role_percentage: Number(d.role_percentage),
      commission_amount: Number(d.commission_amount),
      status: d.status,
      distributed_at: d.distributed_at,
      settled_at: d.settled_at
    }));

    res.json({ code: 0, msg: 'ok', data: { list, total: result.count, page } });
  } catch (error) {
    console.error('获取佣金明细失败:', error);
    res.status(500).json({ code: 1, msg: '获取佣金明细失败' });
  }
};

// GET /commission/orders - Get orders where current user received commission
exports.getMyCommissionOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    const where = { beneficiary_user_id: userId };
    if (status) where.status = status;

    const result = await CommissionDistribution.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const list = result.rows.map(d => ({
      id: d.id,
      order_id: d.order_id,
      order_type: d.order_type,
      commission_amount: Number(d.commission_amount),
      status: d.status,
      created_at: d.created_at
    }));

    res.json({ code: 0, msg: 'ok', data: { list, total: result.count, page } });
  } catch (error) {
    console.error('获取佣金订单失败:', error);
    res.status(500).json({ code: 1, msg: '获取佣金订单失败' });
  }
};

// GET /commission/orders/:orderId/breakdown - 4-party breakdown for one order
exports.getOrderBreakdown = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const distributions = await CommissionDistribution.findAll({
      where: { order_id: orderId },
      order: [['beneficiary_role', 'ASC']]
    });

    const breakdown = distributions.map(d => ({
      role: d.beneficiary_role,
      role_label: {
        headquarters: '总部',
        promoter: '推广者',
        district_partner: '区县合伙人',
        market_partner: '市场合伙人'
      }[d.beneficiary_role],
      beneficiary_user_id: d.beneficiary_user_id,
      role_percentage: Number(d.role_percentage),
      commission_amount: Number(d.commission_amount),
      status: d.status
    }));

    res.json({ code: 0, msg: 'ok', data: {
      order_id: orderId,
      commission_pool: distributions[0] ? Number(distributions[0].commission_pool) : 0,
      breakdown
    }});
  } catch (error) {
    console.error('获取订单佣金明细失败:', error);
    res.status(500).json({ code: 1, msg: '获取订单佣金明细失败' });
  }
};

// GET /commission/partner-chain - Get current user's resolved partner chain
exports.getPartnerChain = async (req, res) => {
  try {
    const userId = req.user.id;
    const relation = await PartnerRelation.findOne({
      where: { promoter_user_id: userId, is_valid: true },
      include: [
        { association: 'districtPartner', attributes: ['id', 'nickname', 'avatar_url'] },
        { association: 'marketPartner', attributes: ['id', 'nickname', 'avatar_url'] }
      ]
    });

    // Also get my own roles
    const myRoles = await PartnerRole.findAll({
      where: { user_id: userId, status: 'active' }
    });

    res.json({ code: 0, msg: 'ok', data: {
      promoter_user_id: userId,
      my_roles: myRoles.map(r => r.role),
      district_partner: relation ? relation.districtPartner : null,
      market_partner: relation ? relation.marketPartner : null,
      district_partner_user_id: relation ? relation.district_partner_user_id : null,
      market_partner_user_id: relation ? relation.market_partner_user_id : null
    }});
  } catch (error) {
    console.error('获取合伙人链失败:', error);
    res.status(500).json({ code: 1, msg: '获取合伙人链失败' });
  }
};

// POST /commission/withdraw - Withdraw commission
exports.withdraw = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ code: 1, msg: '提现金额需大于0' });
    }

    // Get total available across all roles
    const balances = await PartnerCommissionBalance.findAll({
      where: { user_id: userId }
    });

    let totalAvailable = 0;
    balances.forEach(b => { totalAvailable += Number(b.available_amount); });

    if (Number(amount) > totalAvailable) {
      return res.status(400).json({ code: 1, msg: '可提现金额不足' });
    }

    const withdrawal = await PromoterWithdrawal.create({
      user_id: userId,
      amount: Number(amount),
      status: 'pending'
    });

    // Deduct from balances (distribute across roles proportionally)
    if (balances.length > 0) {
      const sequelize = PartnerCommissionBalance.sequelize;
      await sequelize.transaction(async (t) => {
        let remaining = Number(amount);
        for (const b of balances) {
          const deduct = Math.min(Number(b.available_amount), remaining);
          if (deduct > 0) {
            await b.increment({
              available_amount: -deduct,
              withdrawn_amount: deduct
            }, { transaction: t });
            remaining -= deduct;
            if (remaining <= 0) break;
          }
        }
      });
    }

    res.json({ code: 0, msg: '提现申请已提交', data: withdrawal.toJSON() });
  } catch (error) {
    console.error('提现失败:', error);
    res.status(500).json({ code: 1, msg: '提现失败' });
  }
};

// POST /commission/distribute - Webhook for order payment (called by main backend)
exports.distributeWebhook = async (req, res) => {
  try {
    const { order_id, order_type, order_amount, buyer_user_id } = req.body;

    if (!order_id || !order_amount || !buyer_user_id) {
      return res.status(400).json({ code: 1, msg: '缺少必要参数' });
    }

    const distributions = await commissionService.distributeCommission(
      order_id, order_type || 'market', Number(order_amount), buyer_user_id
    );

    res.json({ code: 0, msg: '佣金已分配', data: { count: distributions.length } });
  } catch (error) {
    console.error('佣金分配失败:', error);
    res.status(500).json({ code: 1, msg: '佣金分配失败' });
  }
};

// POST /commission/revert - Revert commission for cancelled/refunded order
exports.revertWebhook = async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ code: 1, msg: '缺少订单ID' });

    await commissionService.revertCommission(order_id);
    res.json({ code: 0, msg: '佣金已回退' });
  } catch (error) {
    console.error('佣金回退失败:', error);
    res.status(500).json({ code: 1, msg: '佣金回退失败' });
  }
};

// POST /commission/confirm - Confirm pending commissions (after order completion)
exports.confirmWebhook = async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ code: 1, msg: '缺少订单ID' });

    await commissionService.confirmCommission(order_id);
    res.json({ code: 0, msg: '佣金已确认' });
  } catch (error) {
    console.error('佣金确认失败:', error);
    res.status(500).json({ code: 1, msg: '佣金确认失败' });
  }
};
