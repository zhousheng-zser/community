const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { QueryTypes } = require('sequelize');
const {
  MerchantAccount,
  MarketShop,
  MarketGood,
  MarketOrder,
  MarketOrderItem,
  MarketApplication,
  User,
  sequelize,
  MarketPayTransaction,
  ApprovalRecord,
  Conversation,
  UserConversation,
  Message
} = require('../models');

function hashPassword(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

function signMerchantToken(payload) {
  const secret = process.env.JWT_SECRET || 'default_secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

function ok(res, data) {
  return res.json({ errno: 0, code: 0, msg: 'ok', data });
}

function bizErr(res, code, msg, http = 200) {
  return res.status(http).json({ errno: code, code, msg, data: null, errmsg: msg });
}

function mapGoodRow(g) {
  const j = g.get ? g.get({ plain: true }) : g;
  const onShelf = j.status === 'on_sale';
  return {
    id: j.id,
    goods_no: j.goods_no,
    title: j.name,
    name: j.name,
    main_image: j.main_image || '',
    image: j.main_image || '',
    price: j.price != null ? String(j.price) : '0',
    stock: j.stock,
    inventory: j.stock,
    sales_count: j.sold_count,
    sales: j.sold_count,
    safe_stock: j.safe_stock != null ? j.safe_stock : 0,
    low_stock_threshold: j.safe_stock != null ? j.safe_stock : 0,
    description: j.description || '',
    is_published: onShelf,
    published: onShelf,
    on_shelf: onShelf,
    status: j.status,
    shop_id: j.shop_id,
    category_key: j.category_key || 'local',
    sort_order: j.sort_order != null ? j.sort_order : 0
  };
}

/**
 * POST /api/v1/merchant-portal/login
 * 调试：DEBUG_MERCHANT_LOGIN=1 时跳过密码校验；账号可空则取库中第一个有效商户（仅联调用）
 */
exports.login = async (req, res) => {
  try {
    const debugSkip = process.env.DEBUG_MERCHANT_LOGIN === '1';
    const username = req.body && req.body.username != null ? String(req.body.username).trim() : '';
    const password = req.body && req.body.password != null ? String(req.body.password) : '';
    if (!debugSkip && (!username || !password)) {
      return res.status(400).json({ errno: 400, errmsg: '请填写账号与密码' });
    }
    let acc;
    if (debugSkip && !username) {
      acc = await MerchantAccount.findOne({
        where: { status: 'active' },
        include: [
          {
            model: MarketShop,
            as: 'shop',
            attributes: ['id', 'name', 'is_active'],
            required: true,
            where: { is_active: 1 }
          }
        ],
        order: [['id', 'ASC']]
      });
      if (!acc) {
        return res.status(404).json({
          errno: 404,
          errmsg: '调试模式：库中无有效商户账号，请先创建商户账户或填写账号'
        });
      }
      console.warn('[DEBUG_MERCHANT_LOGIN] 已跳过密码，使用首个可用商户:', acc.username);
    } else {
      if (!username) {
        return res.status(400).json({ errno: 400, errmsg: '请填写账号' });
      }
      acc = await MerchantAccount.findOne({
        where: { username, status: 'active' },
        include: [{ model: MarketShop, as: 'shop', attributes: ['id', 'name', 'is_active'], required: false }]
      });
      if (!acc) {
        return res.status(401).json({ errno: 401, errmsg: '账号或密码错误' });
      }
      if (!debugSkip && acc.password_hash !== hashPassword(password)) {
        return res.status(401).json({ errno: 401, errmsg: '账号或密码错误' });
      }
      if (debugSkip) {
        console.warn('[DEBUG_MERCHANT_LOGIN] 已跳过密码校验，账号:', username);
      }
    }
    const shop = acc.shop;
    if (!shop || !shop.is_active) {
      return res.status(403).json({ errno: 403, errmsg: '店铺不可用' });
    }
    const token = signMerchantToken(
      {
        portal: 'merchant',
        shop_id: Number(acc.shop_id),
        merchant_account_id: acc.id,
        role: acc.role
      },
    );
    acc.last_login_at = new Date();
    await acc.save().catch(() => {});

    return res.json({
      errno: 0,
      data: {
        token,
        shop: { id: shop.id, name: shop.name },
        account: { id: acc.id, username: acc.username, role: acc.role }
      }
    });
  } catch (e) {
    console.error('merchantPortal login', e);
    return res.status(500).json({ errno: 500, errmsg: '登录失败' });
  }
};

/**
 * POST /api/v1/market/merchant/token/exchange
 * 使用用户登录态 JWT 换取 merchant token（仅已审核通过商家）
 */
exports.exchangeToken = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return bizErr(res, 401, '未登录', 401);

    const latestApprovedApp = await MarketApplication.findOne({
      where: { user_id: userId, status: 'approved' },
      attributes: ['id', 'shop_name', 'phone', 'category', 'address', 'contact_name', 'description', 'logo_url', 'background_url', 'license_url', 'place_photo_url'],
      order: [['created_at', 'DESC'], ['id', 'DESC']]
    });
    if (!latestApprovedApp) {
      return bizErr(res, 403, '商家审核未通过，无法换取商户令牌', 403);
    }

    let shop = await MarketShop.findOne({
      where: {
        name: latestApprovedApp.shop_name,
        contact_phone: latestApprovedApp.phone,
        is_active: 1
      },
      attributes: ['id', 'name'],
      order: [['id', 'DESC']]
    });
    if (!shop) {
      const placeList = Array.isArray(latestApprovedApp.place_photo_url) ? latestApprovedApp.place_photo_url : [];
      const shopNo = `EX${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;
      shop = await MarketShop.create({
        shop_no: shopNo,
        name: latestApprovedApp.shop_name,
        category: latestApprovedApp.category || '其他',
        logo_url: latestApprovedApp.logo_url || null,
        cover_url: latestApprovedApp.background_url || null,
        notice: latestApprovedApp.description || null,
        address: latestApprovedApp.address || null,
        contact_name: latestApprovedApp.contact_name || null,
        contact_phone: latestApprovedApp.phone || null,
        facade_image: placeList[0] || null,
        interior_image: placeList[1] || null,
        license_image: latestApprovedApp.license_url || null,
        is_open: 1,
        is_active: 1
      });
    }

    const token = signMerchantToken({
      portal: 'merchant',
      shop_id: Number(shop.id),
      merchant_account_id: null,
      role: 'owner',
      user_id: Number(userId),
      via: 'user_token_exchange'
    });

    return ok(res, {
      token,
      shop: { id: shop.id, name: shop.name },
      expires_in: 7 * 24 * 60 * 60
    });
  } catch (e) {
    console.error('merchantPortal exchangeToken', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '换取商户令牌失败', data: null });
  }
};

exports.listGoods = async (req, res) => {
  try {
    const shopId = req.merchantAuth.shop_id;
    const qShop = req.query.shop_id != null && req.query.shop_id !== '' ? parseInt(req.query.shop_id, 10) : null;
    if (qShop != null && qShop !== shopId) return bizErr(res, 403, '无权访问该店铺', 403);

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = parseInt(req.query.limit, 10) || 20;
    limit = Math.min(Math.max(limit, 1), 100);
    const offset = (page - 1) * limit;
    const where = { shop_id: shopId };
    const andParts = [];
    if (req.query.need_restock === '1' || req.query.need_restock === 'true') {
      andParts.push(sequelize.literal('`market_goods`.`stock` <= `market_goods`.`safe_stock`'));
    }
    const kw = req.query.keyword != null ? String(req.query.keyword).trim() : '';
    if (kw) {
      andParts.push({ name: { [Op.like]: `%${kw}%` } });
    }
    if (req.query.status === 'on_sale' || req.query.status === 'off_sale') {
      where.status = req.query.status;
    }
    const catKey = req.query.category_key != null ? String(req.query.category_key).trim() : '';
    if (catKey) where.category_key = catKey.slice(0, 50);
    if (andParts.length) {
      where[Op.and] = andParts;
    }

    const { rows, count } = await MarketGood.findAndCountAll({
      where,
      order: [['sort_order', 'DESC'], ['id', 'DESC']],
      limit,
      offset
    });
    const list = rows.map(mapGoodRow);
    return ok(res, { list, total: count, page, limit });
  } catch (e) {
    console.error('merchantPortal listGoods', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '查询失败', data: null });
  }
};

exports.getGood = async (req, res) => {
  try {
    const shopId = req.merchantAuth.shop_id;
    const id = parseInt(req.params.id, 10);
    if (!id) return bizErr(res, 400, '无效 id');
    const g = await MarketGood.findOne({ where: { id, shop_id: shopId } });
    if (!g) return bizErr(res, 404, '商品不存在', 404);
    return ok(res, { goods: mapGoodRow(g) });
  } catch (e) {
    console.error('merchantPortal getGood', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '查询失败', data: null });
  }
};

exports.patchGood = async (req, res) => {
  try {
    const shopId = req.merchantAuth.shop_id;
    const id = parseInt(req.params.id, 10);
    if (!id) return bizErr(res, 400, '无效 id');
    const g = await MarketGood.findOne({ where: { id, shop_id: shopId } });
    if (!g) return bizErr(res, 404, '商品不存在', 404);
    const b = req.body || {};
    if (b.title != null) g.name = String(b.title).slice(0, 150);
    if (b.name != null) g.name = String(b.name).slice(0, 150);
    if (b.description != null) g.description = String(b.description).slice(0, 2000);
    if (b.main_image != null) g.main_image = String(b.main_image).slice(0, 255);
    if (b.price != null) g.price = Number(b.price);
    if (b.stock != null) g.stock = parseInt(b.stock, 10);
    if (b.safe_stock != null) g.safe_stock = parseInt(b.safe_stock, 10);
    if (b.sort_order != null) g.sort_order = parseInt(b.sort_order, 10);
    if (b.category_key != null || b.category != null) {
      g.category_key = String(b.category_key != null ? b.category_key : b.category).slice(0, 50) || 'local';
    }
    await g.save();
    return ok(res, { goods: mapGoodRow(g) });
  } catch (e) {
    console.error('merchantPortal patchGood', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '保存失败', data: null });
  }
};

exports.restock = async (req, res) => {
  try {
    const shopId = req.merchantAuth.shop_id;
    const id = parseInt(req.params.id, 10);
    const qty = parseInt((req.body && (req.body.quantity ?? req.body.qty)) || '0', 10);
    if (!id || !Number.isFinite(qty) || qty <= 0) return bizErr(res, 400, '请输入正整数数量');
    const g = await MarketGood.findOne({ where: { id, shop_id: shopId } });
    if (!g) return bizErr(res, 404, '商品不存在', 404);
    g.stock = Number(g.stock || 0) + qty;
    await g.save();
    return ok(res, { id: g.id, stock: g.stock });
  } catch (e) {
    console.error('merchantPortal restock', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '补货失败', data: null });
  }
};

exports.shelf = async (req, res) => {
  try {
    const shopId = req.merchantAuth.shop_id;
    const id = parseInt(req.params.id, 10);
    if (!id) return bizErr(res, 400, '无效 id');
    const b = req.body || {};
    let pub;
    if (b.published !== undefined) pub = b.published;
    else if (b.is_published !== undefined) pub = b.is_published;
    else if (b.on_shelf !== undefined) pub = b.on_shelf;
    else if (b.status !== undefined) {
      if (b.status === 'on_sale') pub = true;
      else if (b.status === 'off_sale') pub = false;
    }
    if (pub === undefined) return bizErr(res, 400, '缺少 published / is_published / on_shelf / status');
    const on = pub === true || pub === 1 || pub === '1' || pub === 'true';
    const g = await MarketGood.findOne({ where: { id, shop_id: shopId } });
    if (!g) return bizErr(res, 404, '商品不存在', 404);
    g.status = on ? 'on_sale' : 'off_sale';
    await g.save();
    return ok(res, { id: g.id, is_published: on, status: g.status });
  } catch (e) {
    console.error('merchantPortal shelf', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '操作失败', data: null });
  }
};

const ORDER_STATUS_TEXT = {
  pending_payment: '待付款',
  pending_accept: '待接单',
  pending_service: '备货/出餐中',
  pending_receipt: '待收货',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
  paid: '待接单',
  delivering: '待收货',
  closed: '已取消'
};

/** 与运营后台履约动作一致，仅允许本店订单 */
const MERCHANT_ORDER_ACTIONS = {
  accept: { from: ['pending_accept'], to: 'pending_service' },
  reject: { from: ['pending_accept'], to: 'cancelled' },
  dispatch: { from: ['pending_service'], to: 'pending_receipt' },
  /** 外卖场景：送达即完成，不再等待买家确认收货 */
  delivered: { from: ['pending_receipt'], to: 'completed' },
  complete_delivery: { from: ['pending_receipt'], to: 'completed' },
  complete: { from: ['pending_receipt'], to: 'completed' }
};

/** 送达/完成后的后置处理（视为买家已收货） */
async function onMarketOrderCompleted(order) {
  if (!order || order.order_status !== 'completed') return;
  try {
    const items = await MarketOrderItem.findAll({
      where: { order_no: order.order_no },
      attributes: ['goods_id', 'quantity']
    });
    let totalQty = 0;
    for (const it of items) {
      totalQty += Math.max(0, parseInt(it.quantity, 10) || 0);
    }
    if (totalQty > 0 && order.shop_id) {
      await MarketShop.increment('sold_count', { by: totalQty, where: { id: order.shop_id } });
    }
  } catch (e) {
    console.warn('[market] onMarketOrderCompleted sold_count:', e.message);
  }
}

async function ensureOrderEventTable() {
  await sequelize.query(
    `CREATE TABLE IF NOT EXISTS market_order_events (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      order_no VARCHAR(40) NOT NULL,
      shop_id INT NOT NULL,
      user_id INT NOT NULL,
      action VARCHAR(32) NOT NULL,
      title VARCHAR(100) NOT NULL,
      note VARCHAR(255) NULL,
      proof_images_json TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_order_no_created (order_no, created_at),
      INDEX idx_user_created (user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  );
}

async function appendOrderEvent(orderNo, shopId, userId, action, title, note, proofImages) {
  await ensureOrderEventTable();
  await sequelize.query(
    `INSERT INTO market_order_events
      (order_no, shop_id, user_id, action, title, note, proof_images_json, created_at)
     VALUES
      (:orderNo, :shopId, :userId, :action, :title, :note, :proofImages, NOW())`,
    {
      replacements: {
        orderNo,
        shopId,
        userId,
        action,
        title,
        note: note || null,
        proofImages: proofImages ? JSON.stringify(proofImages) : null
      }
    }
  );
}

async function loadOrderEvents(orderNo) {
  await ensureOrderEventTable();
  const rows = await sequelize.query(
    `SELECT id, action, title, note, proof_images_json, created_at
       FROM market_order_events
      WHERE order_no = :orderNo
      ORDER BY created_at ASC, id ASC`,
    { replacements: { orderNo }, type: QueryTypes.SELECT }
  );
  return (rows || []).map((r) => {
    let imgs = [];
    if (r.proof_images_json) {
      try { imgs = JSON.parse(r.proof_images_json); } catch (_e) {}
    }
    return {
      id: r.id,
      action: r.action,
      title: r.title,
      note: r.note || '',
      proof_images: Array.isArray(imgs) ? imgs : [],
      created_at: r.created_at
    };
  });
}

async function pushOrderNodeMessage(userId, orderNo, title, content) {
  const t = await sequelize.transaction();
  try {
    let mapping = await UserConversation.findOne({
      where: { user_id: userId, peer_id: userId, bot_type: 'logistics' },
      transaction: t
    });
    let conversationId = mapping && mapping.conversation_id;
    if (!conversationId) {
      const conv = await Conversation.create(
        { type: 'system', last_message_preview: content },
        { transaction: t }
      );
      conversationId = conv.id;
      if (mapping) {
        mapping.conversation_id = conversationId;
        await mapping.save({ transaction: t });
      } else {
        mapping = await UserConversation.create(
          {
            user_id: userId,
            conversation_id: conversationId,
            peer_id: userId,
            bot_type: 'logistics',
            unread_count: 0,
            is_deleted: false
          },
          { transaction: t }
        );
      }
    }
    await Message.create(
      {
        conversation_id: conversationId,
        sender_id: userId,
        msg_type: 'logistics',
        content: `${title}\n订单号:${orderNo}\n${content}`
      },
      { transaction: t }
    );
    await Conversation.update(
      { last_message_preview: content, updated_at: new Date() },
      { where: { id: conversationId }, transaction: t }
    );
    await UserConversation.update(
      { is_deleted: false },
      { where: { user_id: userId, conversation_id: conversationId }, transaction: t }
    );
    await UserConversation.increment(
      'unread_count',
      { by: 1, where: { user_id: userId, conversation_id: conversationId }, transaction: t }
    );
    await t.commit();
  } catch (e) {
    await t.rollback();
    console.error('pushOrderNodeMessage error:', e);
  }
}

async function writeMerchantApproval(orderNo, fromStatus, toStatus, operator, note) {
  try {
    await ApprovalRecord.create({
      biz_type: 'market_order',
      biz_id: String(orderNo),
      from_status: fromStatus || null,
      to_status: toStatus,
      operator: operator || 'merchant',
      note: note || null
    });
  } catch (_e) {
    /* 非阻断 */
  }
}

function genMerchantGoodsNo(shopId) {
  return `GM${shopId}-${Date.now()}`;
}

const SHOP_PATCHABLE = ['notice', 'contact_name', 'contact_phone', 'business_hours', 'logo_url', 'cover_url'];
const SHOP_FIELD_MAX = {
  notice: 255,
  contact_name: 50,
  contact_phone: 30,
  business_hours: 100,
  logo_url: 255,
  cover_url: 255
};

exports.getShop = async (req, res) => {
  try {
    const shopId = req.merchantAuth.shop_id;
    const shop = await MarketShop.findByPk(shopId);
    if (!shop) return bizErr(res, 404, '店铺不存在', 404);
    const j = shop.get({ plain: true });
    return ok(res, {
      shop: {
        ...j,
        phone: j.contact_phone || '',
        description: j.notice || '',
        community_id: null
      }
    });
  } catch (e) {
    console.error('merchantPortal getShop', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '查询失败', data: null });
  }
};

exports.patchShop = async (req, res) => {
  try {
    const shopId = req.merchantAuth.shop_id;
    const shop = await MarketShop.findByPk(shopId);
    if (!shop) return bizErr(res, 404, '店铺不存在', 404);
    const b = req.body || {};
    if (b.phone !== undefined && b.contact_phone === undefined) b.contact_phone = b.phone;
    if (b.description !== undefined && b.notice === undefined) b.notice = b.description;
    if (b.community_id !== undefined || b.communityId !== undefined) {
      // 当前 market_shops 无 community_id 字段，先对齐请求兼容，返回稳定提示，避免静默成功
      return bizErr(res, 400, 'community_id 暂不支持修改，请走入驻信息变更流程', 400);
    }
    SHOP_PATCHABLE.forEach((k) => {
      if (b[k] !== undefined && b[k] !== null) {
        const max = SHOP_FIELD_MAX[k] || 255;
        shop[k] = String(b[k]).slice(0, max);
      }
    });
    if (b.is_open !== undefined && b.is_open !== null) {
      const v = b.is_open === true || b.is_open === 1 || b.is_open === '1';
      shop.is_open = v ? 1 : 0;
    }
    await shop.save();
    const j = shop.get({ plain: true });
    return ok(res, {
      shop: {
        ...j,
        phone: j.contact_phone || '',
        description: j.notice || '',
        community_id: null
      }
    });
  } catch (e) {
    console.error('merchantPortal patchShop', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '保存失败', data: null });
  }
};

function normalizePlacePhotos(value) {
  let arr = [];
  if (Array.isArray(value)) arr = value;
  else if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) arr = parsed;
    } catch (_) {
      arr = value.split(',').map((x) => x.trim()).filter(Boolean);
    }
  }
  // 排序规则：按前端上传顺序（数组下标）稳定返回，同时去空值
  return arr
    .map((x) => (x == null ? '' : String(x).trim()))
    .filter(Boolean);
}

exports.getApplication = async (req, res) => {
  try {
    const row = await MarketApplication.findOne({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC'], ['id', 'DESC']]
    });
    if (!row) return ok(res, { application: null });
    const j = row.get({ plain: true });
    const placePhotos = normalizePlacePhotos(j.place_photo_url);
    return ok(res, {
      application: {
        ...j,
        place_photo_url: placePhotos
      }
    });
  } catch (e) {
    console.error('merchantPortal getApplication', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '查询失败', data: null });
  }
};

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function ymdLocal(d) {
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function sumPaidRevenue(shopId, start, end) {
  const sum = await MarketOrder.sum('payable_amount', {
    where: {
      shop_id: shopId,
      pay_status: 'paid',
      created_at: { [Op.between]: [start, end] }
    }
  });
  return sum != null ? Number(sum) : 0;
}

exports.getDashboard = async (req, res) => {
  try {
    const shopId = req.merchantAuth.shop_id;
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(new Date(todayStart.getTime() - 86400000));
    const yesterdayEnd = endOfDay(new Date(yesterdayStart));
    const range7Start = new Date(todayStart);
    range7Start.setDate(range7Start.getDate() - 6);
    const range30Start = new Date(todayStart);
    range30Start.setDate(range30Start.getDate() - 29);
    const todayEnd = endOfDay(now);

    const [
      pendingAccept,
      pendingService,
      pendingReceipt,
      lowStockGoods,
      todayPaidCount,
      onSaleGoods,
      revenueToday,
      revenueYesterday,
      revenue7d,
      revenue30d,
      paidCount7d,
      paidCount30d,
      completed30d,
      refund30d,
      chartRows,
      statusRows,
      topGoodsRows,
      recentRows
    ] = await Promise.all([
      MarketOrder.count({ where: { shop_id: shopId, order_status: 'pending_accept' } }),
      MarketOrder.count({ where: { shop_id: shopId, order_status: 'pending_service' } }),
      MarketOrder.count({ where: { shop_id: shopId, order_status: 'pending_receipt' } }),
      MarketGood.count({
        where: {
          shop_id: shopId,
          [Op.and]: [sequelize.literal('`market_goods`.`stock` <= `market_goods`.`safe_stock`')]
        }
      }),
      MarketOrder.count({
        where: {
          shop_id: shopId,
          pay_status: 'paid',
          created_at: { [Op.gte]: todayStart }
        }
      }),
      MarketGood.count({ where: { shop_id: shopId, status: 'on_sale' } }),
      sumPaidRevenue(shopId, todayStart, todayEnd),
      sumPaidRevenue(shopId, yesterdayStart, yesterdayEnd),
      sumPaidRevenue(shopId, range7Start, todayEnd),
      sumPaidRevenue(shopId, range30Start, todayEnd),
      MarketOrder.count({
        where: {
          shop_id: shopId,
          pay_status: 'paid',
          created_at: { [Op.between]: [range7Start, todayEnd] }
        }
      }),
      MarketOrder.count({
        where: {
          shop_id: shopId,
          pay_status: 'paid',
          created_at: { [Op.between]: [range30Start, todayEnd] }
        }
      }),
      MarketOrder.count({
        where: {
          shop_id: shopId,
          order_status: 'completed',
          created_at: { [Op.gte]: range30Start }
        }
      }),
      MarketOrder.count({
        where: {
          shop_id: shopId,
          [Op.or]: [{ order_status: 'refunded' }, { pay_status: 'refunded' }],
          created_at: { [Op.gte]: range30Start }
        }
      }),
      sequelize.query(
        `SELECT DATE(created_at) AS d, COALESCE(SUM(payable_amount), 0) AS total
         FROM market_orders
         WHERE shop_id = :shopId AND pay_status = 'paid'
           AND created_at >= :start AND created_at <= :end
         GROUP BY DATE(created_at)`,
        { replacements: { shopId, start: range7Start, end: todayEnd }, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT order_status, COUNT(*) AS cnt FROM market_orders
         WHERE shop_id = :shopId AND created_at >= :start
         GROUP BY order_status`,
        { replacements: { shopId, start: range30Start }, type: QueryTypes.SELECT }
      ),
      MarketGood.findAll({
        where: { shop_id: shopId },
        order: [
          ['sold_count', 'DESC'],
          ['id', 'DESC']
        ],
        limit: 5,
        attributes: ['id', 'name', 'sold_count', 'price', 'main_image', 'stock']
      }),
      MarketOrder.findAll({
        where: { shop_id: shopId },
        order: [['created_at', 'DESC']],
        limit: 10,
        attributes: ['order_no', 'order_status', 'pay_status', 'payable_amount', 'created_at']
      })
    ]);

    const dayMap = {};
    for (const row of chartRows || []) {
      const raw = row.d;
      const key =
        raw instanceof Date
          ? ymdLocal(raw)
          : String(raw).slice(0, 10);
      dayMap[key] = Number(row.total);
    }
    const chart7d = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(todayStart);
      day.setDate(day.getDate() - i);
      const key = ymdLocal(day);
      const rev = dayMap[key] != null ? dayMap[key] : 0;
      chart7d.push({
        date: `${day.getMonth() + 1}/${day.getDate()}`,
        date_key: key,
        revenue: rev.toFixed(2)
      });
    }

    let revMax = 0;
    chart7d.forEach((c) => {
      const v = Number(c.revenue);
      if (v > revMax) revMax = v;
    });
    if (revMax <= 0) revMax = 1;

    const statusBreakdown = {};
    for (const row of statusRows || []) {
      statusBreakdown[row.order_status] = Number(row.cnt);
    }

    const avgTicket7d = paidCount7d > 0 ? (revenue7d / paidCount7d).toFixed(2) : '0.00';
    const avgTicket30d = paidCount30d > 0 ? (revenue30d / paidCount30d).toFixed(2) : '0.00';

    let dodPct = null;
    if (revenueYesterday > 0) {
      dodPct = (((revenueToday - revenueYesterday) / revenueYesterday) * 100).toFixed(1);
    }

    const top_goods = topGoodsRows.map((g) => {
      const j = g.get({ plain: true });
      return {
        id: j.id,
        name: j.name,
        sold_count: j.sold_count,
        stock: j.stock,
        price: j.price != null ? String(j.price) : '0',
        main_image: j.main_image || ''
      };
    });

    const recent_orders = recentRows.map((o) => {
      const j = o.get({ plain: true });
      return {
        order_no: j.order_no,
        order_status: j.order_status,
        order_status_text: ORDER_STATUS_TEXT[j.order_status] || j.order_status,
        pay_status: j.pay_status,
        payable_amount: j.payable_amount != null ? String(j.payable_amount) : '0',
        created_at: j.created_at
      };
    });

    return ok(res, {
      pending_accept: pendingAccept,
      pending_service: pendingService,
      pending_receipt: pendingReceipt,
      todo_fulfillment: pendingAccept + pendingService + pendingReceipt,
      low_stock_goods: lowStockGoods,
      today_paid_orders: todayPaidCount,
      on_sale_goods: onSaleGoods,
      revenue_today: revenueToday.toFixed(2),
      revenue_yesterday: revenueYesterday.toFixed(2),
      revenue_7d: revenue7d.toFixed(2),
      revenue_30d: revenue30d.toFixed(2),
      revenue_dod_pct: dodPct,
      paid_orders_7d: paidCount7d,
      paid_orders_30d: paidCount30d,
      avg_ticket_7d: avgTicket7d,
      avg_ticket_30d: avgTicket30d,
      completed_orders_30d: completed30d,
      refund_orders_30d: refund30d,
      chart_7d: chart7d.map((c) => ({ ...c, bar_pct: Math.round((Number(c.revenue) / revMax) * 100) })),
      status_breakdown_30d: statusBreakdown,
      top_goods,
      recent_orders
    });
  } catch (e) {
    console.error('merchantPortal getDashboard', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '查询失败', data: null });
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const shopId = req.merchantAuth.shop_id;
    const orderNo = String(req.params.orderNo || req.query.order_no || req.query.orderNo || '').trim();
    if (!orderNo) return bizErr(res, 400, '缺少订单号');
    let order = await MarketOrder.findOne({
      where: { order_no: orderNo, shop_id: shopId },
      include: [{ model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'], required: false }]
    });
    if (!order && process.env.DEBUG_SKIP_MERCHANT_TOKEN === '1') {
      // 测试联调：放宽店铺过滤，避免调试态兜底店铺与订单归属不一致导致假 404
      order = await MarketOrder.findOne({
        where: { order_no: orderNo },
        include: [{ model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'], required: false }]
      });
    }
    if (!order) return bizErr(res, 404, '订单不存在', 404);
    const j = order.get({ plain: true });
    const items = await MarketOrderItem.findAll({ where: { order_no: orderNo } });
    const payments = await MarketPayTransaction.findAll({
      where: { order_no: orderNo },
      order: [['created_at', 'DESC']]
    });
    const buyer = j.buyer || {};
    const itemRows = items.map((it) => {
      const t = it.get({ plain: true });
      return {
        goods_name: t.goods_name_snapshot,
        quantity: t.quantity,
        unit_price: String(t.unit_price_snapshot),
        amount: String(t.amount),
        image: t.goods_image_snapshot,
        specs: t.specs_snapshot
      };
    });
    const payRows = payments.map((p) => {
      const pr = p.get({ plain: true });
      return {
        out_trade_no: pr.out_trade_no,
        pay_status: pr.pay_status,
        amount: pr.amount != null ? String(pr.amount) : '0',
        paid_at: pr.paid_at,
        created_at: pr.created_at
      };
    });
    const timeline = [];
    timeline.push({ at: j.created_at, title: '提交订单', detail: '' });
    if (j.paid_at) timeline.push({ at: j.paid_at, title: '支付成功', detail: j.pay_status || '' });
    if (j.order_status === 'pending_accept' && j.pay_status === 'paid') {
      timeline.push({ at: j.updated_at, title: '待商家接单', detail: '' });
    }
    if (['pending_service', 'pending_receipt', 'completed', 'cancelled', 'refunded'].includes(j.order_status)) {
      timeline.push({ at: j.updated_at, title: `状态：${ORDER_STATUS_TEXT[j.order_status] || j.order_status}`, detail: '' });
    }
    if (j.cancelled_at) timeline.push({ at: j.cancelled_at, title: '订单关闭/取消', detail: j.cancel_reason || '' });

    const fulfillmentEvents = await loadOrderEvents(orderNo);
    return ok(res, {
      order: {
        id: j.id,
        order_no: j.order_no,
        order_status: j.order_status,
        order_status_text: ORDER_STATUS_TEXT[j.order_status] || j.order_status,
        pay_status: j.pay_status,
        goods_amount: j.goods_amount != null ? String(j.goods_amount) : '0',
        delivery_fee: j.delivery_fee != null ? String(j.delivery_fee) : '0',
        discount_amount: j.discount_amount != null ? String(j.discount_amount) : '0',
        payable_amount: j.payable_amount != null ? String(j.payable_amount) : '0',
        delivery_mode: j.delivery_mode,
        receiver_name: j.receiver_name,
        receiver_phone: j.receiver_phone,
        receiver_address: j.receiver_address,
        remark: j.remark,
        cancel_reason: j.cancel_reason,
        paid_at: j.paid_at,
        cancelled_at: j.cancelled_at,
        created_at: j.created_at,
        updated_at: j.updated_at,
        buyer_nickname: buyer.nickname,
        buyer_phone_masked: buyer.phone
          ? `${String(buyer.phone).slice(0, 3)}****${String(buyer.phone).slice(-4)}`
          : ''
      },
      items: itemRows,
      payments: payRows,
      timeline,
      fulfillment_events: fulfillmentEvents
    });
  } catch (e) {
    console.error('merchantPortal getOrderDetail', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '查询失败', data: null });
  }
};

exports.applyOrderAction = async (req, res) => {
  try {
    const shopId = req.merchantAuth.shop_id;
    const orderNo = String(req.params.orderNo || '').trim();
    const { action, note } = req.body || {};
    const proofImages = Array.isArray(req.body && req.body.proof_images)
      ? req.body.proof_images.slice(0, 6).map((x) => String(x || '').trim()).filter(Boolean)
      : [];
    const config = MERCHANT_ORDER_ACTIONS[action];
    if (!config) return bizErr(res, 400, '不支持的操作');
    const row = await MarketOrder.findOne({ where: { order_no: orderNo, shop_id: shopId } });
    if (!row) return bizErr(res, 404, '订单不存在', 404);
    if (!config.from.includes(row.order_status)) {
      return bizErr(res, 400, `当前状态 ${row.order_status} 不可执行 ${action}`);
    }
    const fromStatus = row.order_status;
    row.order_status = config.to;
    if (action === 'reject') {
      row.cancel_reason = note || '商家拒单';
      row.cancelled_at = new Date();
      if (row.pay_status === 'paid' || row.pay_status === 'refund_pending') {
        row.pay_status = 'refunded';
      }
    }
    await row.save();
    if (row.order_status === 'completed' && fromStatus !== 'completed') {
      await onMarketOrderCompleted(row);
    }
    await writeMerchantApproval(orderNo, fromStatus, row.order_status, `shop:${shopId}`, note);
    const nodeTitleMap = {
      accept: '商家已接单',
      reject: '商家已拒单并退款',
      dispatch: '商家已开始配送',
      delivered: '商家已送达，订单已完成',
      complete_delivery: '商家已送达，订单已完成',
      complete: '订单已完成'
    };
    const nodeTitle = nodeTitleMap[action] || '订单状态更新';
    const notifyContent =
      row.order_status === 'completed'
        ? (note || '商品已送达，感谢您的购买，欢迎评价')
        : (note || `当前状态：${ORDER_STATUS_TEXT[row.order_status] || row.order_status}`);
    await appendOrderEvent(orderNo, shopId, row.user_id, action, nodeTitle, note || '', proofImages);
    await pushOrderNodeMessage(row.user_id, orderNo, nodeTitle, notifyContent);
    const j = row.get({ plain: true });
    return ok(res, {
      order_no: j.order_no,
      order_status: j.order_status,
      order_status_text: ORDER_STATUS_TEXT[j.order_status] || j.order_status,
      pay_status: j.pay_status
    });
  } catch (e) {
    console.error('merchantPortal applyOrderAction', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '操作失败', data: null });
  }
};

exports.createGood = async (req, res) => {
  try {
    const shopId = req.merchantAuth.shop_id;
    const b = req.body || {};
    const name = String(b.name || b.title || '').trim();
    if (!name) return bizErr(res, 400, '请填写商品名称');
    const price = Number(b.price);
    if (!Number.isFinite(price) || price < 0) return bizErr(res, 400, '价格无效');
    const category_key = String(b.category_key || b.category || 'local').slice(0, 50);
    const publishFlag =
      b.published !== undefined ? b.published
        : b.is_published !== undefined ? b.is_published
          : b.on_shelf !== undefined ? b.on_shelf
            : b.status !== undefined
              ? (b.status === 'on_sale' ? true : (b.status === 'off_sale' ? false : undefined))
              : undefined;
    const isOnSale =
      publishFlag === undefined
        ? true
        : (publishFlag === true || publishFlag === 1 || publishFlag === '1' || publishFlag === 'true');
    const g = await MarketGood.create({
      goods_no: genMerchantGoodsNo(shopId),
      shop_id: shopId,
      category_key,
      name,
      description: b.description != null ? String(b.description).slice(0, 2000) : '',
      main_image:
        b.main_image != null
          ? String(b.main_image).slice(0, 255)
          : (b.image != null ? String(b.image).slice(0, 255) : ''),
      price,
      stock: Math.max(0, parseInt(b.stock, 10) || 0),
      safe_stock: Math.max(0, parseInt(b.safe_stock, 10) || 0),
      sort_order: parseInt(b.sort_order, 10) || 0,
      status: isOnSale ? 'on_sale' : 'off_sale'
    });
    return ok(res, { goods: mapGoodRow(g) });
  } catch (e) {
    console.error('merchantPortal createGood', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '创建失败', data: null });
  }
};

exports.listPayments = async (req, res) => {
  try {
    const shopId = req.merchantAuth.shop_id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = parseInt(req.query.limit, 10) || 20;
    limit = Math.min(Math.max(limit, 1), 100);
    const offset = (page - 1) * limit;
    const countRows = await sequelize.query(
      `SELECT COUNT(*) AS c FROM market_pay_transactions p
       INNER JOIN market_orders o ON p.order_no = o.order_no AND o.shop_id = :shopId`,
      { replacements: { shopId }, type: QueryTypes.SELECT }
    );
    const total = countRows[0] ? Number(countRows[0].c) : 0;
    const rows = await sequelize.query(
      `SELECT p.id, p.order_no, p.out_trade_no, p.pay_status, p.amount, p.paid_at, p.created_at
       FROM market_pay_transactions p
       INNER JOIN market_orders o ON p.order_no = o.order_no AND o.shop_id = :shopId
       ORDER BY p.created_at DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { shopId, limit, offset }, type: QueryTypes.SELECT }
    );
    const list = rows.map((r) => ({
      ...r,
      amount: r.amount != null ? String(r.amount) : '0'
    }));
    return ok(res, { list, total, page, limit });
  } catch (e) {
    console.error('merchantPortal listPayments', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '查询失败', data: null });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const shopId = req.merchantAuth.shop_id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = parseInt(req.query.limit, 10) || 20;
    limit = Math.min(Math.max(limit, 1), 100);
    const offset = (page - 1) * limit;
    const where = { shop_id: shopId };
    if (req.query.order_status) where.order_status = req.query.order_status;
    if (req.query.pay_status) where.pay_status = req.query.pay_status;

    const { rows, count } = await MarketOrder.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [{ model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'], required: false }]
    });

    const list = [];
    for (const order of rows) {
      const j = order.get({ plain: true });
      const items = await MarketOrderItem.findAll({
        where: { order_no: j.order_no },
        attributes: ['goods_name_snapshot', 'quantity', 'unit_price_snapshot', 'amount', 'goods_image_snapshot']
      });
      const buyer = j.buyer || {};
      list.push({
        id: j.id,
        order_no: j.order_no,
        order_status: j.order_status,
        order_status_text: ORDER_STATUS_TEXT[j.order_status] || j.order_status,
        pay_status: j.pay_status,
        payable_amount: j.payable_amount != null ? String(j.payable_amount) : '0',
        goods_amount: j.goods_amount != null ? String(j.goods_amount) : '0',
        receiver_name: j.receiver_name,
        receiver_phone: j.receiver_phone,
        receiver_address: j.receiver_address,
        remark: j.remark,
        created_at: j.created_at,
        buyer_nickname: buyer.nickname,
        buyer_phone_masked: buyer.phone ? `${String(buyer.phone).slice(0, 3)}****${String(buyer.phone).slice(-4)}` : '',
        items: items.map((it) => {
          const t = it.get({ plain: true });
          return {
            goods_name: t.goods_name_snapshot,
            quantity: t.quantity,
            unit_price: String(t.unit_price_snapshot),
            amount: String(t.amount),
            image: t.goods_image_snapshot
          };
        }),
        item_count: items.length
      });
    }

    return ok(res, { list, total: count, page, limit });
  } catch (e) {
    console.error('merchantPortal listOrders', e);
    return res.status(500).json({ errno: 500, code: 500, msg: '查询失败', data: null });
  }
};
