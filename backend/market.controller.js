const db = require('../../../models');
const { MerchantShop, MerchantGoods } = db;

const ok = (res, data, msg = 'ok') => res.json({ code: 0, msg, data });
const fail = (res, msg, statusCode = 400) => res.status(statusCode).json({ code: 1, msg });

function getUserId(req) {
  return req.user && req.user.id ? Number(req.user.id) : 0;
}

// POST /market/apply
exports.apply = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);

    const body = req.body || {};
    const shopName = String(body.shop_name || body.shopName || '').trim();
    const contactName = String(body.contact_name || body.contactName || '').trim();
    const phone = String(body.phone || '').trim();

    if (!shopName) return fail(res, '商家名称不能为空');
    if (!contactName) return fail(res, '联系人姓名不能为空');
    if (!phone) return fail(res, '联系电话不能为空');

    // 检查是否已有申请记录
    const existing = await MerchantShop.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    if (existing) {
      if (existing.status === 'approved') {
        return fail(res, '您已是认证商家，无需重复申请');
      }
      // 更新已有记录
      await existing.update({
        name: shopName,
        contact_name: contactName,
        contact_phone: phone,
        address: body.address || existing.address,
        latitude: body.latitude != null ? Number(body.latitude) : existing.latitude,
        longitude: body.longitude != null ? Number(body.longitude) : existing.longitude,
        description: body.description || existing.description,
        category: body.category || existing.category,
        logo: body.logo_url || body.logoUrl || existing.logo,
        status: 'pending',
        reject_reason: ''
      });
      return ok(res, { id: existing.id, status: 'pending' }, '提交成功，等待审核');
    }

    // 创建新店铺
    const shop = await MerchantShop.create({
      user_id: userId,
      name: shopName,
      contact_name: contactName,
      contact_phone: phone,
      address: body.address || '',
      latitude: body.latitude != null ? Number(body.latitude) : null,
      longitude: body.longitude != null ? Number(body.longitude) : null,
      description: body.description || '',
      category: body.category || '',
      logo: body.logo_url || body.logoUrl || '',
      status: 'pending',
      reject_reason: ''
    });

    ok(res, { id: shop.id, status: 'pending' }, '提交成功，等待审核');
  } catch (err) {
    console.error('[market/apply]', err);
    fail(res, '提交失败，请重试', 500);
  }
};

// GET /market/search
exports.search = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/shops
exports.getShops = async (req, res) => {
  try {
    const query = req.query || {};
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 50);
    const offset = (page - 1) * limit;

    const where = { status: 'approved' };
    // 支持按名称搜索
    if (query.keyword) {
      where.name = { [db.Sequelize.Op.like]: `%${String(query.keyword).trim()}%` };
    }
    // 支持按分类筛选
    if (query.category) {
      where.category = String(query.category).trim();
    }

    const { count, rows } = await MerchantShop.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    ok(res, {
      list: rows.map((r) => ({
        id: r.id,
        name: r.name,
        logo: r.logo,
        address: r.address,
        category: r.category,
        business_hours: r.business_hours,
        description: r.description,
        latitude: r.latitude,
        longitude: r.longitude
      })),
      total: count,
      page,
      limit
    });
  } catch (err) {
    console.error('[market/shops]', err);
    fail(res, '获取店铺列表失败', 500);
  }
};

// GET /market/shops/:shopId
exports.getShopDetail = async (req, res) => {
  try {
    const shopId = Number(req.params.shopId);
    if (!shopId) return fail(res, '无效店铺ID');

    const shop = await MerchantShop.findByPk(shopId);
    if (!shop) return fail(res, '店铺不存在', 404);
    if (shop.status !== 'approved') return fail(res, '店铺暂未通过审核', 403);

    // 统计商品数量
    const goodsCount = await MerchantGoods.count({
      where: { shop_id: shopId, status: 'on_sale', is_published: 1 }
    });

    ok(res, {
      id: shop.id,
      name: shop.name,
      logo: shop.logo,
      contact_name: shop.contact_name,
      contact_phone: shop.contact_phone,
      address: shop.address,
      latitude: shop.latitude,
      longitude: shop.longitude,
      business_hours: shop.business_hours,
      description: shop.description,
      category: shop.category,
      goods_count: goodsCount
    });
  } catch (err) {
    console.error('[market/shop/detail]', err);
    fail(res, '获取店铺详情失败', 500);
  }
};

// GET /market/shops/:shopId/goods
exports.getShopGoods = async (req, res) => {
  try {
    const shopId = Number(req.params.shopId);
    if (!shopId) return fail(res, '无效店铺ID');

    const query = req.query || {};
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const where = {
      shop_id: shopId,
      status: 'on_sale',
      is_published: 1
    };

    const { count, rows } = await MerchantGoods.findAndCountAll({
      where,
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset
    });

    ok(res, {
      list: rows.map((r) => ({
        id: r.id,
        shop_id: r.shop_id,
        name: r.name,
        title: r.title || r.name,
        main_image: r.main_image,
        image: r.main_image,
        price: Number(r.price),
        stock: r.stock,
        safe_stock: r.safe_stock,
        sales_count: r.sales_count,
        description: r.description,
        desc: r.description,
        status: r.status,
        created_at: r.created_at
      })),
      total: count,
      page,
      limit
    });
  } catch (err) {
    console.error('[market/shops/goods]', err);
    fail(res, '获取店铺商品失败', 500);
  }
};

// GET /market/goods/:goodsId
exports.getGoodsDetail = async (req, res) => {
  try {
    const goodsId = Number(req.params.goodsId);
    if (!goodsId) return fail(res, '无效商品ID');

    const row = await MerchantGoods.findByPk(goodsId);
    if (!row) return fail(res, '商品不存在', 404);

    // 查询所属店铺信息
    const shop = await MerchantShop.findByPk(row.shop_id);

    ok(res, {
      id: row.id,
      shop_id: row.shop_id,
      name: row.name,
      title: row.title || row.name,
      main_image: row.main_image,
      image: row.main_image,
      price: Number(row.price),
      original_price: row.original_price ? Number(row.original_price) : null,
      stock: row.stock,
      safe_stock: row.safe_stock,
      sales_count: row.sales_count,
      description: row.description,
      desc: row.description,
      status: row.status,
      is_published: row.is_published,
      shop: shop ? {
        id: shop.id,
        name: shop.name,
        address: shop.address
      } : null
    });
  } catch (err) {
    console.error('[market/goods/detail]', err);
    fail(res, '获取商品详情失败', 500);
  }
};

// GET /market/shops/:shopId/contact
exports.getShopContact = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/cart
exports.getCart = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/cart/items
exports.addCartItem = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// PUT /market/cart/items/:itemId
exports.updateCartItem = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// DELETE /market/cart/items/:itemId
exports.deleteCartItem = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// DELETE /market/cart
exports.clearCart = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/orders/preview
exports.previewOrder = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/orders
exports.createOrder = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/orders
exports.getMyOrders = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/orders/:orderNo
exports.getOrderDetail = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/orders/:orderNo/cancel
exports.cancelOrder = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// DELETE /market/orders/:orderNo
exports.deleteOrder = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/orders/:orderNo/buy-again
exports.buyAgain = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/orders/:orderNo/logistics
exports.getLogistics = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/payments/create
exports.createPayment = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/payments/status
exports.getPaymentStatus = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/payments/mock-success
exports.mockPaymentSuccess = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/orders/:orderNo/confirm-receipt
exports.confirmReceipt = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/orders/:orderNo/refund
exports.applyRefund = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// GET /market/orders/:orderNo/refund
exports.getRefundDetail = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// POST /market/orders/:orderNo/refund/cancel
exports.cancelRefund = async (req, res) => {
  res.status(501).json({ code: 1, msg: '由主后端实现' });
};

// ===== 兼容接口：GET /market/shop/goods（商家视角，返回全部商品含下架）=====
exports.getShopGoodsCompat = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return fail(res, '未登录', 401);

    const query = req.query || {};
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 200);
    const offset = (page - 1) * limit;

    // 查找当前用户的店铺
    const shop = await MerchantShop.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });
    if (!shop) return fail(res, '暂无店铺信息', 404);

    // 支持前端传入 shop_id 做权限校验
    const qShopId = query.shop_id != null ? Number(query.shop_id) : (query.shopId != null ? Number(query.shopId) : null);
    if (qShopId && qShopId !== shop.id) {
      return fail(res, '无权查看该店铺商品', 403);
    }

    const where = { shop_id: shop.id };

    const { count, rows } = await MerchantGoods.findAndCountAll({
      where,
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset
    });

    ok(res, {
      list: rows.map((r) => ({
        id: r.id,
        shop_id: r.shop_id,
        shopId: r.shop_id,
        name: r.name,
        title: r.title || r.name,
        main_image: r.main_image,
        image: r.main_image,
        price: Number(r.price),
        stock: r.stock,
        inventory: r.stock,
        safe_stock: r.safe_stock,
        low_stock_threshold: r.safe_stock,
        sales_count: r.sales_count,
        sales: r.sales_count,
        description: r.description,
        desc: r.description,
        status: r.status,
        is_published: r.is_published,
        published: r.is_published === 1,
        on_shelf: r.status === 'on_sale',
        created_at: r.created_at
      })),
      total: count,
      page,
      limit
    });
  } catch (err) {
    console.error('[market/shop/goods]', err);
    fail(res, '获取商品列表失败', 500);
  }
};

// ===== 管理后台：商家入驻审核 =====

// GET /market/admin/shops（管理后台用：列出所有待审核/已审核店铺）
exports.getAdminShopList = async (req, res) => {
  try {
    const query = req.query || {};
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const where = {};
    if (query.status) where.status = query.status;
    if (query.keyword) {
      where.name = { [db.Sequelize.Op.like]: `%${String(query.keyword).trim()}%` };
    }

    const { count, rows } = await MerchantShop.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    ok(res, {
      list: rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        name: r.name,
        contact_name: r.contact_name,
        contact_phone: r.contact_phone,
        address: r.address,
        category: r.category,
        status: r.status,
        reject_reason: r.reject_reason,
        created_at: r.created_at
      })),
      total: count,
      page,
      limit
    });
  } catch (err) {
    console.error('[market/admin/shops]', err);
    fail(res, '获取店铺列表失败', 500);
  }
};

// POST /market/admin/shops/:id/review（审核店铺）
exports.reviewShop = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return fail(res, '无效店铺ID');

    const body = req.body || {};
    const status = body.status;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return fail(res, '审核状态必须是 approved 或 rejected');
    }

    const shop = await MerchantShop.findByPk(id);
    if (!shop) return fail(res, '店铺不存在', 404);

    await shop.update({
      status,
      reject_reason: status === 'rejected' ? (body.reject_reason || '') : ''
    });

    ok(res, { id: shop.id, status: shop.status }, '审核完成');
  } catch (err) {
    console.error('[market/admin/shops/review]', err);
    fail(res, '审核失败', 500);
  }
};
