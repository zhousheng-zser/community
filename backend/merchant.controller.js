const db = require('../../../models');
const { MerchantShop, MerchantGoods } = db;

const ok = (res, data, msg = 'ok') => res.json({ code: 0, msg, data });
const fail = (res, msg, statusCode = 400) => res.status(statusCode).json({ code: 1, msg });

// ===== 辅助函数 =====

function getUserId(req) {
  return req.user && req.user.id ? Number(req.user.id) : 0;
}

async function getShopByUser(userId) {
  if (!userId) return null;
  return MerchantShop.findOne({
    where: { user_id: userId },
    order: [['created_at', 'DESC']]
  });
}

function normalizeShop(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    logo: row.logo,
    contact_name: row.contact_name,
    contact_phone: row.contact_phone,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    business_hours: row.business_hours,
    description: row.description,
    category: row.category,
    status: row.status,
    reject_reason: row.reject_reason,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function normalizeGoods(row) {
  if (!row) return null;
  return {
    id: row.id,
    shop_id: row.shop_id,
    user_id: row.user_id,
    name: row.name,
    title: row.title || row.name,
    main_image: row.main_image,
    price: Number(row.price),
    original_price: row.original_price ? Number(row.original_price) : null,
    stock: row.stock,
    safe_stock: row.safe_stock,
    sales_count: row.sales_count,
    description: row.description,
    status: row.status,
    is_published: row.is_published,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// ===== 7.1 仪表盘和店铺 =====

// GET /market/merchant/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);

    const shop = await getShopByUser(userId);
    if (!shop) return fail(res, '暂无店铺信息', 404);

    // 统计商品数量
    const goodsCount = await MerchantGoods.count({ where: { shop_id: shop.id } });
    const onSaleCount = await MerchantGoods.count({ where: { shop_id: shop.id, status: 'on_sale' } });
    const lowStockCount = await MerchantGoods.count({
      where: {
        shop_id: shop.id,
        stock: { [db.Sequelize.Op.lte]: db.Sequelize.col('safe_stock') }
      }
    });

    ok(res, {
      shop: normalizeShop(shop),
      stats: {
        goods_total: goodsCount,
        goods_on_sale: onSaleCount,
        goods_low_stock: lowStockCount
      }
    });
  } catch (err) {
    console.error('[merchant/dashboard]', err);
    fail(res, '获取仪表盘失败', 500);
  }
};

// GET /market/merchant/shop
exports.getShop = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);

    const shop = await getShopByUser(userId);
    if (!shop) return fail(res, '暂无店铺信息', 404);

    ok(res, normalizeShop(shop));
  } catch (err) {
    console.error('[merchant/shop]', err);
    fail(res, '获取店铺信息失败', 500);
  }
};

// PATCH /market/merchant/shop
exports.updateShop = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);

    const shop = await getShopByUser(userId);
    if (!shop) return fail(res, '暂无店铺信息', 404);

    const body = req.body || {};
    const allowed = ['name', 'logo', 'contact_name', 'contact_phone', 'address',
      'latitude', 'longitude', 'business_hours', 'description', 'category'];
    const updateData = {};
    allowed.forEach((k) => {
      if (body[k] !== undefined) updateData[k] = body[k];
    });

    await shop.update(updateData);
    ok(res, normalizeShop(shop), '更新成功');
  } catch (err) {
    console.error('[merchant/shop/update]', err);
    fail(res, '更新店铺信息失败', 500);
  }
};

// ===== 7.2 商品管理 =====

// GET /market/merchant/goods
exports.getGoodsList = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);

    const shop = await getShopByUser(userId);
    if (!shop) return fail(res, '暂无店铺信息', 404);

    const query = req.query || {};
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 200);
    const offset = (page - 1) * limit;

    const where = { shop_id: shop.id };
    // 支持按 shop_id 过滤（前端兼容）
    const qShopId = query.shop_id != null ? Number(query.shop_id) : (query.shopId != null ? Number(query.shopId) : null);
    if (qShopId && qShopId !== shop.id) {
      return fail(res, '无权查看该店铺商品', 403);
    }

    const { count, rows } = await MerchantGoods.findAndCountAll({
      where,
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset
    });

    ok(res, {
      list: rows.map(normalizeGoods),
      total: count,
      page,
      limit
    });
  } catch (err) {
    console.error('[merchant/goods]', err);
    fail(res, '获取商品列表失败', 500);
  }
};

// POST /market/merchant/goods
exports.createGoods = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);

    const body = req.body || {};
    const shopId = body.shop_id != null ? Number(body.shop_id) : (body.shopId != null ? Number(body.shopId) : null);

    // 如果没有传入 shop_id，尝试用当前用户的店铺
    let shop;
    if (shopId) {
      shop = await MerchantShop.findByPk(shopId);
      if (!shop) return fail(res, '店铺不存在', 404);
      if (shop.user_id !== userId) return fail(res, '无权操作该店铺', 403);
    } else {
      shop = await getShopByUser(userId);
      if (!shop) return fail(res, '暂无店铺信息，请先入驻', 404);
    }

    const name = String(body.name || body.title || '').trim();
    if (!name) return fail(res, '商品名称不能为空');

    const price = parseFloat(body.price);
    if (!Number.isFinite(price) || price < 0) return fail(res, '价格格式错误');

    const status = body.status === 'on_sale' ? 'on_sale' : 'off_sale';
    const isPublished = body.is_published === 1 || body.is_published === true || body.published === true || body.on_shelf === true ? 1 : 0;

    const row = await MerchantGoods.create({
      shop_id: shop.id,
      user_id: userId,
      name,
      title: name,
      main_image: body.main_image || body.image || '',
      price,
      original_price: body.original_price != null ? parseFloat(body.original_price) : null,
      stock: Math.max(parseInt(body.stock, 10) || 0, 0),
      safe_stock: Math.max(parseInt(body.safe_stock, 10) || 5, 0),
      sales_count: 0,
      description: body.description || body.desc || '',
      status: isPublished ? 'on_sale' : status,
      is_published: isPublished,
      sort_order: parseInt(body.sort_order, 10) || 0
    });

    ok(res, normalizeGoods(row), '创建成功');
  } catch (err) {
    console.error('[merchant/goods/create]', err);
    fail(res, '创建商品失败', 500);
  }
};

// GET /market/merchant/goods/:id
exports.getGoodsDetail = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);

    const id = Number(req.params.id);
    if (!id) return fail(res, '无效商品ID');

    const row = await MerchantGoods.findByPk(id);
    if (!row) return fail(res, '商品不存在', 404);

    // 权限校验：只能查看自己店铺的商品
    const shop = await getShopByUser(userId);
    if (!shop || row.shop_id !== shop.id) {
      return fail(res, '无权查看该商品', 403);
    }

    ok(res, { goods: normalizeGoods(row) });
  } catch (err) {
    console.error('[merchant/goods/detail]', err);
    fail(res, '获取商品详情失败', 500);
  }
};

// PATCH /market/merchant/goods/:id
exports.updateGoods = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);

    const id = Number(req.params.id);
    if (!id) return fail(res, '无效商品ID');

    const row = await MerchantGoods.findByPk(id);
    if (!row) return fail(res, '商品不存在', 404);

    const shop = await getShopByUser(userId);
    if (!shop || row.shop_id !== shop.id) {
      return fail(res, '无权操作该商品', 403);
    }

    const body = req.body || {};
    const updateData = {};

    if (body.name !== undefined) {
      const n = String(body.name).trim();
      if (!n) return fail(res, '商品名称不能为空');
      updateData.name = n;
      updateData.title = n;
    }
    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.main_image !== undefined) updateData.main_image = body.main_image;
    if (body.image !== undefined) updateData.main_image = body.image;
    if (body.price !== undefined) {
      const p = parseFloat(body.price);
      if (!Number.isFinite(p) || p < 0) return fail(res, '价格格式错误');
      updateData.price = p;
    }
    if (body.original_price !== undefined) {
      const p = body.original_price != null ? parseFloat(body.original_price) : null;
      updateData.original_price = Number.isFinite(p) ? p : null;
    }
    if (body.stock !== undefined) updateData.stock = Math.max(parseInt(body.stock, 10) || 0, 0);
    if (body.safe_stock !== undefined) updateData.safe_stock = Math.max(parseInt(body.safe_stock, 10) || 5, 0);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.desc !== undefined) updateData.description = body.desc;
    if (body.sort_order !== undefined) updateData.sort_order = parseInt(body.sort_order, 10) || 0;

    // status 和 is_published 在 toggleShelf 中单独处理，这里不覆盖

    await row.update(updateData);
    ok(res, normalizeGoods(row), '更新成功');
  } catch (err) {
    console.error('[merchant/goods/update]', err);
    fail(res, '更新商品失败', 500);
  }
};

// POST /market/merchant/goods/:id/restock
exports.restockGoods = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);

    const id = Number(req.params.id);
    if (!id) return fail(res, '无效商品ID');

    const row = await MerchantGoods.findByPk(id);
    if (!row) return fail(res, '商品不存在', 404);

    const shop = await getShopByUser(userId);
    if (!shop || row.shop_id !== shop.id) {
      return fail(res, '无权操作该商品', 403);
    }

    const body = req.body || {};
    const qty = parseInt(body.quantity || body.qty, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      return fail(res, '补货数量必须是正整数');
    }

    await row.update({ stock: row.stock + qty });
    ok(res, normalizeGoods(row), '补货成功');
  } catch (err) {
    console.error('[merchant/goods/restock]', err);
    fail(res, '补货失败', 500);
  }
};

// POST /market/merchant/goods/:id/shelf
exports.toggleShelf = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);

    const id = Number(req.params.id);
    if (!id) return fail(res, '无效商品ID');

    const row = await MerchantGoods.findByPk(id);
    if (!row) return fail(res, '商品不存在', 404);

    const shop = await getShopByUser(userId);
    if (!shop || row.shop_id !== shop.id) {
      return fail(res, '无权操作该商品', 403);
    }

    const body = req.body || {};
    let published;
    if (body.status === 'on_sale') published = true;
    else if (body.status === 'off_sale') published = false;
    else if (body.published === true || body.published === 1) published = true;
    else if (body.published === false || body.published === 0) published = false;
    else if (body.is_published === 1) published = true;
    else if (body.is_published === 0) published = false;
    else {
      // 无显式参数则切换状态
      published = row.status !== 'on_sale';
    }

    const newStatus = published ? 'on_sale' : 'off_sale';
    const newIsPublished = published ? 1 : 0;

    await row.update({ status: newStatus, is_published: newIsPublished });
    ok(res, normalizeGoods(row), published ? '上架成功' : '下架成功');
  } catch (err) {
    console.error('[merchant/goods/shelf]', err);
    fail(res, '上下架操作失败', 500);
  }
};

// ===== 7.3 订单管理（由主后端实现） =====

// GET /market/merchant/orders
exports.getOrders = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/merchant/orders/:orderNo
exports.getOrderDetail = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/merchant/orders/:orderNo/action
exports.orderAction = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/merchant/payments
exports.getPayments = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// ===== 7.4 客户管理（由主后端实现） =====

// GET /market/merchant/customers/list
exports.getCustomers = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/merchant/customers/:id/orders
exports.getCustomerOrders = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/merchant/customers/:id/stats
exports.getCustomerStats = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// ===== 7.5 营销管理（由主后端实现） =====

// GET /market/merchant/marketing/coupons
exports.getMarketingCoupons = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/merchant/marketing/coupons
exports.createMarketingCoupon = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/merchant/marketing/coupons/:id
exports.updateMarketingCoupon = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/merchant/marketing/stats
exports.getMarketingStats = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// ===== 7.6 退款管理（由主后端实现） =====

// GET /market/merchant/refunds/list
exports.getRefunds = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/merchant/refunds/:id
exports.getRefundDetail = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/merchant/refunds/:id/approve
exports.approveRefund = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/merchant/refunds/:id/reject
exports.rejectRefund = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/merchant/refunds/stats/summary
exports.getRefundStats = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};
