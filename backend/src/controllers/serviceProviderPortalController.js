const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const {
  ServiceProviderPortalAccount,
  ServiceProviderProfile,
  Service,
  ServiceOrder,
  Category
} = require('../models');
const {
  getServiceIdsForProfile,
  buildProviderOrderWhereClause,
  findProviderOrderById,
  providerOrderInclude
} = require('../utils/serviceProviderOrderScope');

const SERVICE_ORDER_STATUS_TEXT = {
  pending_pay: '待支付',
  pending_accept: '待服务商接单',
  pending_worker_accept: '待技工接单',
  paid_pending_dispatch: '待派单',
  dispatched: '已派单',
  in_service: '服务中',
  pending_user_confirm: '待用户确认完成',
  completed: '已完成',
  cancelled: '已取消',
  closed: '已关闭'
};

function hashPassword(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

function serializeOrderRow(plain, { withDetail = false } = {}) {
  const amt = plain.amount != null ? String(plain.amount) : '';
  const w = plain.assignedWorker;
  const svc = plain.service;
  const out = {
    id: plain.id,
    order_no: plain.order_no || null,
    status: plain.status,
    status_text: SERVICE_ORDER_STATUS_TEXT[plain.status] || plain.status,
    pay_status: plain.pay_status,
    service_id: plain.service_id,
    service_title: svc ? svc.title : (plain.goods_name || ''),
    amount: amt,
    pay_amount: amt,
    created_at: plain.created_at,
    appointment_time: plain.appointment_time,
    community_id: plain.community_id,
    group_key: plain.group_key || null,
    worker_id: plain.assigned_worker_id || null,
    provider_user_id: plain.provider_user_id || null,
    contact_name: plain.contact_name || null,
    contact_phone: plain.contact_phone || null,
    qty: plain.qty != null ? plain.qty : 1,
    remark: plain.remark || null,
    fulfillment_meta: plain.fulfillment_meta || {},
    buyer: plain.buyer
      ? { id: plain.buyer.id, nickname: plain.buyer.nickname, phone: plain.buyer.phone || '' }
      : null,
    assigned_worker: w
      ? { id: w.id, nickname: w.nickname, name: w.nickname || '', avatar_url: w.avatar_url || '', worker_user_id: w.id }
      : null
  };
  if (withDetail) {
    out.address_snapshot = plain.address_snapshot || null;
    out.service = svc || null;
  }
  return out;
}

async function loadProfileForPortal(req) {
  const profile = await ServiceProviderProfile.findOne({
    where: { id: req.spPortal.profile_id, status: 'active' }
  });
  if (!profile || profile.user_id !== req.spPortal.provider_user_id) return null;
  return profile;
}

/**
 * POST /api/v1/service-provider-portal/login
 */
exports.login = async (req, res) => {
  try {
    const debugSkip = process.env.DEBUG_SERVICE_PROVIDER_PORTAL_LOGIN === '1';
    const username = req.body && req.body.username != null ? String(req.body.username).trim() : '';
    const password = req.body && req.body.password != null ? String(req.body.password) : '';
    if (!debugSkip && (!username || !password)) {
      return res.status(400).json({ errno: 400, errmsg: '请填写账号与密码' });
    }

    let acc;
    if (debugSkip && !username) {
      acc = await ServiceProviderPortalAccount.findOne({
        where: { status: 'active' },
        include: [
          {
            model: ServiceProviderProfile,
            as: 'profile',
            required: true,
            where: { status: 'active' }
          }
        ],
        order: [['id', 'ASC']]
      });
      if (!acc) {
        return res.status(404).json({
          errno: 404,
          errmsg:
            '调试模式：库中无服务商门户账号。请先执行: npm run migrate:sp-portal-accounts，再 node scripts/seed-service-provider-portal-demo-account.js，或通过运营后台 POST /admin/service-provider-portal-accounts 创建。'
        });
      }
      console.warn('[DEBUG_SERVICE_PROVIDER_PORTAL_LOGIN] 跳过密码，使用首个账号:', acc.username);
    } else {
      acc = await ServiceProviderPortalAccount.findOne({
        where: { username, status: 'active' },
        include: [{ model: ServiceProviderProfile, as: 'profile', required: true }]
      });
      if (!acc) {
        return res.status(401).json({ errno: 401, errmsg: '账号或密码错误' });
      }
      if (!debugSkip && acc.password_hash !== hashPassword(password)) {
        return res.status(401).json({ errno: 401, errmsg: '账号或密码错误' });
      }
      if (debugSkip) {
        console.warn('[DEBUG_SERVICE_PROVIDER_PORTAL_LOGIN] 已跳过密码校验:', username);
      }
    }

    const prof = acc.profile;
    if (!prof || prof.status !== 'active') {
      return res.status(403).json({ errno: 403, errmsg: '服务商未激活' });
    }

    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(
      {
        portal: 'service_provider',
        provider_user_id: prof.user_id,
        profile_id: prof.id,
        sp_account_id: acc.id
      },
      secret,
      { expiresIn: '7d' }
    );

    acc.last_login_at = new Date();
    await acc.save().catch(() => {});

    return res.json({
      errno: 0,
      data: {
        token,
        profile: {
          id: prof.id,
          shop_name: prof.shop_name,
          user_id: prof.user_id,
          community_id: prof.community_id
        },
        account: { id: acc.id, username: acc.username, role: acc.role }
      }
    });
  } catch (e) {
    console.error('serviceProviderPortal login', e);
    return res.status(500).json({ errno: 500, errmsg: '登录失败' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const j = profile.get({ plain: true });
    let username = '';
    if (req.spPortal.sp_account_id) {
      const acc = await ServiceProviderPortalAccount.findByPk(req.spPortal.sp_account_id);
      if (acc) username = acc.username;
    }
    return res.json({
      errno: 0,
      data: {
        profile: {
          id: j.id,
          shop_name: j.shop_name,
          contact_name: j.contact_name,
          phone: j.phone,
          shop_front_url: j.shop_front_url,
          environment_url: j.environment_url,
          community_id: j.community_id,
          status: j.status
        },
        account: { username }
      }
    });
  } catch (e) {
    console.error('spPortal getMe', e);
    return res.status(500).json({ errno: 500, errmsg: '查询失败' });
  }
};

/** 仅允许改展示类字段 */
exports.patchProfile = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const b = req.body || {};
    const allow = ['shop_front_url', 'environment_url', 'contact_name', 'phone'];
    for (const k of allow) {
      if (b[k] !== undefined) profile[k] = b[k];
    }
    await profile.save();
    return res.json({ errno: 0, data: { profile: profile.get({ plain: true }) } });
  } catch (e) {
    console.error('spPortal patchProfile', e);
    return res.status(500).json({ errno: 500, errmsg: '保存失败' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const serviceIds = await getServiceIdsForProfile(profile.id);
    const scope = buildProviderOrderWhereClause(profile, serviceIds);

    const t0 = new Date();
    t0.setHours(0, 0, 0, 0);
    const t7 = new Date(t0);
    t7.setDate(t7.getDate() - 7);

    const [
      services_count,
      pending_accept,
      in_service,
      pending_user_confirm,
      orders_today,
      orders_completed_7d,
      orders_total,
      paid_sum_7d
    ] = await Promise.all([
      Service.count({ where: { provider_id: profile.id } }),
      ServiceOrder.count({
        where: { [Op.and]: [scope, { status: 'pending_accept' }] }
      }),
      ServiceOrder.count({
        where: { [Op.and]: [scope, { status: 'in_service' }] }
      }),
      ServiceOrder.count({
        where: { [Op.and]: [scope, { status: 'pending_user_confirm' }] }
      }),
      ServiceOrder.count({
        where: { [Op.and]: [scope, { created_at: { [Op.gte]: t0 } }] }
      }),
      ServiceOrder.count({
        where: {
          [Op.and]: [
            scope,
            { status: 'completed' },
            { updated_at: { [Op.gte]: t7 } }
          ]
        }
      }),
      ServiceOrder.count({ where: { [Op.and]: [scope] } }),
      ServiceOrder.sum('amount', {
        where: {
          [Op.and]: [
            scope,
            { pay_status: 'paid' },
            { created_at: { [Op.gte]: t7 } }
          ]
        }
      })
    ]);

    return res.json({
      errno: 0,
      data: {
        shop_name: profile.shop_name,
        community_id: profile.community_id,
        services_count,
        pending_accept,
        in_service,
        pending_user_confirm,
        orders_today,
        orders_completed_7d,
        orders_total,
        paid_amount_7d: Number(paid_sum_7d || 0)
      }
    });
  } catch (e) {
    console.error('spPortal getDashboard', e);
    return res.status(500).json({ errno: 500, errmsg: '统计失败' });
  }
};

exports.listCategories = async (req, res) => {
  try {
    const rows = await Category.findAll({
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'name', 'group_type', 'icon_url']
    });
    return res.json({ errno: 0, data: { list: rows.map((r) => r.get({ plain: true })) } });
  } catch (e) {
    console.error('spPortal listCategories', e);
    return res.status(500).json({ errno: 500, errmsg: '查询失败' });
  }
};

function mapServiceRow(s) {
  const j = s.get ? s.get({ plain: true }) : s;
  const cat = j.category || {};
  return {
    id: j.id,
    category_id: j.category_id,
    category_name: cat.name || '',
    title: j.title,
    sub_title: j.sub_title,
    description: j.description,
    price: j.price != null ? String(j.price) : '0',
    cover_image: j.cover_image || '',
    detail_images: j.detail_images || [],
    tags: j.tags || [],
    is_published: j.is_published === 1 || j.is_published === true,
    sales_count: j.sales_count || 0,
    order_count: j.order_count || 0,
    provider_id: j.provider_id
  };
}

exports.listServices = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = parseInt(req.query.limit, 10) || 20;
    limit = Math.min(Math.max(limit, 1), 100);
    const offset = (page - 1) * limit;
    const parts = [{ provider_id: profile.id }];
    const kw = req.query.keyword != null ? String(req.query.keyword).trim() : '';
    if (kw) {
      parts.push({
        [Op.or]: [
          { title: { [Op.like]: `%${kw}%` } },
          { sub_title: { [Op.like]: `%${kw}%` } }
        ]
      });
    }
    if (req.query.published === '1') {
      parts.push({
        [Op.or]: [{ is_published: 1 }, { is_published: true }]
      });
    } else if (req.query.published === '0') {
      parts.push({
        [Op.or]: [{ is_published: 0 }, { is_published: false }]
      });
    }

    const { rows, count } = await Service.findAndCountAll({
      where: { [Op.and]: parts },
      include: [{ model: Category, as: 'category', attributes: ['name', 'group_type'], required: false }],
      order: [['id', 'DESC']],
      limit,
      offset
    });
    return res.json({
      errno: 0,
      data: { list: rows.map(mapServiceRow), total: count, page, limit }
    });
  } catch (e) {
    console.error('spPortal listServices', e);
    return res.status(500).json({ errno: 500, errmsg: '查询失败' });
  }
};

exports.getService = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const id = parseInt(req.params.id, 10);
    const s = await Service.findOne({
      where: { id, provider_id: profile.id },
      include: [{ model: Category, as: 'category', attributes: ['name', 'group_type'], required: false }]
    });
    if (!s) return res.status(404).json({ errno: 404, errmsg: '服务不存在' });
    return res.json({ errno: 0, data: { service: mapServiceRow(s) } });
  } catch (e) {
    console.error('spPortal getService', e);
    return res.status(500).json({ errno: 500, errmsg: '查询失败' });
  }
};

exports.createService = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const b = req.body || {};
    if (!b.title || b.price == null) {
      return res.status(400).json({ errno: 400, errmsg: '请填写服务标题与价格' });
    }
    const row = await Service.create({
      category_id: b.category_id != null ? parseInt(b.category_id, 10) : null,
      title: String(b.title).slice(0, 200),
      sub_title: b.sub_title != null ? String(b.sub_title).slice(0, 200) : null,
      description: b.description != null ? String(b.description) : '',
      price: Number(b.price),
      cover_image: b.cover_image != null ? String(b.cover_image).slice(0, 255) : '',
      detail_images: Array.isArray(b.detail_images) ? b.detail_images : null,
      tags: Array.isArray(b.tags) ? b.tags : null,
      is_published: b.is_published === false || b.is_published === 0 ? 0 : 1,
      provider_id: profile.id,
      sales_count: 0,
      order_count: 0
    });
    return res.json({ errno: 0, data: { service: mapServiceRow(row) } });
  } catch (e) {
    console.error('spPortal createService', e);
    return res.status(500).json({ errno: 500, errmsg: '创建失败' });
  }
};

exports.patchService = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const id = parseInt(req.params.id, 10);
    const s = await Service.findOne({ where: { id, provider_id: profile.id } });
    if (!s) return res.status(404).json({ errno: 404, errmsg: '服务不存在' });
    const b = req.body || {};
    const fields = ['title', 'sub_title', 'description', 'price', 'cover_image', 'detail_images', 'tags', 'category_id'];
    for (const k of fields) {
      if (b[k] !== undefined) {
        if (k === 'price') s.price = Number(b[k]);
        else if (k === 'category_id') s.category_id = b[k] != null ? parseInt(b[k], 10) : null;
        else s[k] = b[k];
      }
    }
    if (b.is_published !== undefined) {
      s.is_published = b.is_published === false || b.is_published === 0 ? 0 : 1;
    }
    await s.save();
    const reloaded = await Service.findByPk(id, {
      include: [{ model: Category, as: 'category', attributes: ['name', 'group_type'], required: false }]
    });
    return res.json({ errno: 0, data: { service: mapServiceRow(reloaded) } });
  } catch (e) {
    console.error('spPortal patchService', e);
    return res.status(500).json({ errno: 500, errmsg: '保存失败' });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const serviceIds = await getServiceIdsForProfile(profile.id);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = parseInt(req.query.limit, 10) || 20;
    limit = Math.min(Math.max(limit, 1), 50);
    const offset = (page - 1) * limit;
    const scope = buildProviderOrderWhereClause(profile, serviceIds);
    const where = { [Op.and]: [scope] };
    if (req.query.status) {
      where[Op.and].push({ status: String(req.query.status) });
    } else if (req.query.include_all !== '1') {
      where[Op.and].push({ status: { [Op.notIn]: ['cancelled', 'closed'] } });
    }
    const kw = req.query.keyword != null ? String(req.query.keyword).trim() : '';
    if (kw) {
      where[Op.and].push({
        [Op.or]: [
          { order_no: { [Op.like]: `%${kw}%` } },
          { goods_name: { [Op.like]: `%${kw}%` } }
        ]
      });
    }

    const { rows, count } = await ServiceOrder.findAndCountAll({
      where,
      include: providerOrderInclude(),
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    return res.json({
      errno: 0,
      data: {
        list: rows.map((r) => serializeOrderRow(r.get({ plain: true }))),
        total: count,
        page,
        limit
      }
    });
  } catch (e) {
    console.error('spPortal listOrders', e);
    return res.status(500).json({ errno: 500, errmsg: '查询失败' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const serviceIds = await getServiceIdsForProfile(profile.id);
    const id = parseInt(req.params.id, 10);
    const order = await findProviderOrderById(id, profile, serviceIds);
    if (!order) return res.status(404).json({ errno: 404, errmsg: '订单不存在' });
    return res.json({ errno: 0, data: serializeOrderRow(order.get({ plain: true }), { withDetail: true }) });
  } catch (e) {
    console.error('spPortal getOrder', e);
    return res.status(500).json({ errno: 500, errmsg: '查询失败' });
  }
};

exports.orderAccept = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const serviceIds = await getServiceIdsForProfile(profile.id);
    const id = parseInt(req.params.id, 10);
    const order = await findProviderOrderById(id, profile, serviceIds);
    if (!order) return res.status(404).json({ errno: 404, errmsg: '订单不存在' });
    if (order.pay_status !== 'paid') return res.status(400).json({ errno: 400, errmsg: '订单未支付' });
    if (order.status !== 'pending_accept') return res.status(400).json({ errno: 400, errmsg: '当前状态不可接单' });
    order.status = 'in_service';
    await order.save();
    return res.json({
      errno: 0,
      data: {
        id: order.id,
        status: order.status,
        status_text: SERVICE_ORDER_STATUS_TEXT[order.status] || order.status
      }
    });
  } catch (e) {
    console.error('spPortal orderAccept', e);
    return res.status(500).json({ errno: 500, errmsg: '操作失败' });
  }
};

exports.orderCheckIn = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const serviceIds = await getServiceIdsForProfile(profile.id);
    const id = parseInt(req.params.id, 10);
    const { latitude, longitude, accuracy } = req.body || {};
    if (latitude == null || longitude == null) {
      return res.status(400).json({ errno: 400, errmsg: '缺少 latitude / longitude' });
    }
    const order = await findProviderOrderById(id, profile, serviceIds);
    if (!order) return res.status(404).json({ errno: 404, errmsg: '订单不存在' });
    const meta0 = order.fulfillment_meta || {};
    const checkIns = [...((meta0.check_ins || [])).map((x) => x)];
    checkIns.push({
      at: new Date().toISOString(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy != null ? Number(accuracy) : null
    });
    order.fulfillment_meta = { ...meta0, check_ins: checkIns };
    order.changed('fulfillment_meta', true);
    await order.save();
    return res.json({ errno: 0, data: { id: order.id, check_ins: order.fulfillment_meta.check_ins } });
  } catch (e) {
    console.error('spPortal orderCheckIn', e);
    return res.status(500).json({ errno: 500, errmsg: '打卡失败' });
  }
};

exports.orderEvidence = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const serviceIds = await getServiceIdsForProfile(profile.id);
    const id = parseInt(req.params.id, 10);
    const kind = req.body && req.body.kind;
    const urls = req.body && req.body.urls;
    if (!kind || !['before', 'after'].includes(String(kind))) {
      return res.status(400).json({ errno: 400, errmsg: 'kind 须为 before 或 after' });
    }
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ errno: 400, errmsg: 'urls 须为非空数组' });
    }
    const order = await findProviderOrderById(id, profile, serviceIds);
    if (!order) return res.status(404).json({ errno: 404, errmsg: '订单不存在' });
    const meta0 = order.fulfillment_meta || {};
    const e0 = meta0.evidence || {};
    const evidence = {
      before: [...((e0.before || [])).map((x) => x)],
      after: [...((e0.after || [])).map((x) => x)]
    };
    const key = kind === 'before' ? 'before' : 'after';
    evidence[key] = [...(evidence[key] || []), ...urls.map((u) => String(u).slice(0, 512))];
    order.fulfillment_meta = { ...meta0, evidence };
    order.changed('fulfillment_meta', true);
    await order.save();
    return res.json({ errno: 0, data: { id: order.id, evidence: order.fulfillment_meta.evidence } });
  } catch (e) {
    console.error('spPortal orderEvidence', e);
    return res.status(500).json({ errno: 500, errmsg: '上传失败' });
  }
};

exports.orderComplete = async (req, res) => {
  try {
    const profile = await loadProfileForPortal(req);
    if (!profile) return res.status(403).json({ errno: 403, errmsg: '无效服务商' });
    const serviceIds = await getServiceIdsForProfile(profile.id);
    const id = parseInt(req.params.id, 10);
    const order = await findProviderOrderById(id, profile, serviceIds);
    if (!order) return res.status(404).json({ errno: 404, errmsg: '订单不存在' });
    if (order.status !== 'in_service') return res.status(400).json({ errno: 400, errmsg: '当前状态不可完成服务' });
    const meta = { ...(order.fulfillment_meta || {}) };
    if (meta.await_user_confirm) {
      order.status = 'pending_user_confirm';
    } else {
      order.status = 'completed';
    }
    await order.save();
    return res.json({
      errno: 0,
      data: {
        id: order.id,
        status: order.status,
        status_text: SERVICE_ORDER_STATUS_TEXT[order.status] || order.status
      }
    });
  } catch (e) {
    console.error('spPortal orderComplete', e);
    return res.status(500).json({ errno: 500, errmsg: '操作失败' });
  }
};
