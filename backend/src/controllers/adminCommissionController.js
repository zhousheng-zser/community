const { Op } = require('sequelize');
const db = require('../models');
const { CommissionDistribution } = db;
const commissionService = require('../modules/commission/services/commission.service');

exports.getSummary = async (req, res) => {
  try {
    const where = { status: { [Op.ne]: 'refunded' } };
    if (req.query.order_type) where.order_type = req.query.order_type;
    const rows = await CommissionDistribution.findAll({
      where,
      attributes: ['order_id', 'order_type', 'order_amount', 'commission_pool', 'commission_amount']
    });
    const orderMap = new Map();
    let totalCommission = 0;
    rows.forEach((r) => {
      totalCommission += Number(r.commission_amount) || 0;
      const key = `${r.order_type}:${r.order_id}`;
      if (!orderMap.has(key)) {
        orderMap.set(key, {
          order_id: r.order_id,
          order_type: r.order_type,
          order_amount: Number(r.order_amount) || 0,
          commission_pool: Number(r.commission_pool) || 0
        });
      }
    });
    let totalGmv = 0;
    let totalPool = 0;
    orderMap.forEach((o) => {
      totalGmv += o.order_amount;
      totalPool += o.commission_pool;
    });
    res.json({
      code: 0,
      msg: 'ok',
      data: {
        order_count: orderMap.size,
        distribution_rows: rows.length,
        total_gmv: Number(totalGmv.toFixed(2)),
        total_commission_pool: Number(totalPool.toFixed(2)),
        total_commission_amount: Number(totalCommission.toFixed(2))
      }
    });
  } catch (e) {
    console.error('[admin/commission/summary]', e);
    res.status(500).json({ code: 1, msg: '汇总失败' });
  }
};

exports.listDistributions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = Math.min(parseInt(req.query.page_size, 10) || 20, 100);
    const where = {};
    if (req.query.order_id) where.order_id = String(req.query.order_id);
    if (req.query.order_type) where.order_type = req.query.order_type;
    if (req.query.status) where.status = req.query.status;
    if (req.query.beneficiary_user_id) where.beneficiary_user_id = req.query.beneficiary_user_id;
    const result = await CommissionDistribution.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
    res.json({
      code: 0,
      msg: 'ok',
      data: {
        list: result.rows.map((r) => r.toJSON()),
        total: result.count,
        page,
        page_size: pageSize
      }
    });
  } catch (e) {
    console.error('[admin/commission/distributions]', e);
    res.status(500).json({ code: 1, msg: '加载失败' });
  }
};

exports.getOrderBreakdown = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const distributions = await CommissionDistribution.findAll({
      where: { order_id: orderId },
      order: [['beneficiary_role', 'ASC']]
    });
    const breakdown = distributions.map((d) => ({
      role: d.beneficiary_role,
      beneficiary_user_id: d.beneficiary_user_id,
      role_percentage: Number(d.role_percentage),
      commission_amount: Number(d.commission_amount),
      status: d.status
    }));
    res.json({
      code: 0,
      msg: 'ok',
      data: {
        order_id: orderId,
        order_amount: distributions[0] ? Number(distributions[0].order_amount) : 0,
        commission_pool: distributions[0] ? Number(distributions[0].commission_pool) : 0,
        breakdown
      }
    });
  } catch (e) {
    console.error('[admin/commission/breakdown]', e);
    res.status(500).json({ code: 1, msg: '查询失败' });
  }
};

exports.getRates = async (req, res) => {
  try {
    const rates = await commissionService.getCommissionRates();
    res.json({ code: 0, msg: 'ok', data: rates });
  } catch (e) {
    res.status(500).json({ code: 1, msg: '加载失败' });
  }
};
