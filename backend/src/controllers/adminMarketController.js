const crypto = require('crypto');
const { Op } = require('sequelize');
const {
    MarketOrder,
    MarketOrderItem,
    MarketPayTransaction,
    MarketShop,
    MarketGood,
    MarketApplication,
    MarketShopReview,
    ServiceProviderApplication,
    ServiceProviderProfile,
    ServiceProviderPortalAccount,
    Service,
    ServiceOrder,
    User,
    ApprovalRecord,
    sequelize
} = require('../models');
const { logAdminAction } = require('./adminAuditHelper');

function hashSpPortalPassword(raw) {
    return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

function genShopNo() {
    const r = Math.floor(Math.random() * 900000) + 100000;
    return `ADM${Date.now()}${r}`;
}
function genGoodsNo(shopId) {
    return `GADM${shopId}-${Date.now()}`;
}

const ORDER_STATUS_ACTIONS = {
    accept: { from: ['pending_accept'], to: 'pending_service' },
    reject: { from: ['pending_accept'], to: 'cancelled' },
    dispatch: { from: ['pending_service'], to: 'pending_receipt' },
    complete: { from: ['pending_receipt'], to: 'completed' },
    close: { from: ['pending_payment'], to: 'cancelled' }
};

async function writeApproval(bizType, bizId, fromStatus, toStatus, operator, note) {
    try {
        await ApprovalRecord.create({
            biz_type: bizType,
            biz_id: String(bizId),
            from_status: fromStatus || null,
            to_status: toStatus,
            operator,
            note: note || null
        });
    } catch (_e) {
        // 审批记录不是主流程阻断项
    }
}

// ---------- 集市订单 ----------
exports.listOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = (page - 1) * limit;
        const where = {};
        if (req.query.order_status) where.order_status = req.query.order_status;
        if (req.query.pay_status) where.pay_status = req.query.pay_status;
        if (req.query.shop_id) where.shop_id = req.query.shop_id;
        if (req.query.order_no) where.order_no = { [Op.like]: `%${String(req.query.order_no).trim()}%` };
        const { rows, count } = await MarketOrder.findAndCountAll({
            where, offset, limit, order: [['created_at', 'DESC']],
            include: [
                { model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'], required: false },
                { model: MarketShop, as: 'shop', attributes: ['id', 'name', 'shop_no'], required: false }
            ]
        });
        res.json({ message: 'ok', total: count, page, limit, data: rows });
    } catch (e) {
        console.error('admin listOrders:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.listOrderFulfillment = async (req, res) => {
    try {
        const statuses = req.query.statuses
            ? String(req.query.statuses).split(',')
            : ['pending_accept', 'pending_service', 'pending_receipt'];
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = (page - 1) * limit;
        const where = { order_status: { [Op.in]: statuses } };
        if (req.query.shop_id) where.shop_id = req.query.shop_id;
        const { rows, count } = await MarketOrder.findAndCountAll({
            where, offset, limit, order: [['created_at', 'DESC']],
            include: [{ model: MarketShop, as: 'shop', attributes: ['id', 'name'], required: false }]
        });
        res.json({ message: 'ok', total: count, page, limit, data: rows });
    } catch (e) {
        console.error('admin listOrderFulfillment:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.applyOrderAction = async (req, res) => {
    try {
        const orderNo = req.params.orderNo;
        const { action, note } = req.body || {};
        const config = ORDER_STATUS_ACTIONS[action];
        if (!config) return res.status(400).json({ error: '不支持的 action' });
        const row = await MarketOrder.findOne({ where: { order_no: orderNo } });
        if (!row) return res.status(404).json({ error: '订单不存在' });
        if (!config.from.includes(row.order_status)) {
            return res.status(400).json({ error: `当前状态 ${row.order_status} 不能执行 ${action}` });
        }
        const fromStatus = row.order_status;
        row.order_status = config.to;
        if (action === 'reject') {
            row.cancel_reason = note || '后台拒单';
            row.cancelled_at = new Date();
        }
        await row.save();
        await writeApproval('market_order', orderNo, fromStatus, row.order_status, (req.admin && req.admin.sub) || 'admin', note);
        await logAdminAction(req, `order_${action}`, 'market_order', orderNo, { fromStatus, toStatus: row.order_status, note });
        res.json({ message: '操作成功', data: row });
    } catch (e) {
        console.error('admin applyOrderAction:', e);
        res.status(500).json({ error: '操作失败' });
    }
};

exports.getOrderDetail = async (req, res) => {
    try {
        const orderNo = req.params.orderNo;
        const order = await MarketOrder.findOne({
            where: { order_no: orderNo },
            include: [
                { model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'], required: false },
                { model: MarketShop, as: 'shop', attributes: ['id', 'name', 'shop_no'], required: false }
            ]
        });
        if (!order) return res.status(404).json({ error: '订单不存在' });
        const items = await MarketOrderItem.findAll({ where: { order_no: orderNo } });
        const payments = await MarketPayTransaction.findAll({ where: { order_no: orderNo }, order: [['created_at', 'DESC']] });
        res.json({ message: 'ok', data: { order, items, payments } });
    } catch (e) {
        console.error('admin getOrderDetail:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

// ---------- 支付流水 ----------
exports.listPayments = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = (page - 1) * limit;
        const where = {};
        if (req.query.pay_status) where.pay_status = req.query.pay_status;
        if (req.query.order_no) where.order_no = { [Op.like]: `%${String(req.query.order_no).trim()}%` };
        const { rows, count } = await MarketPayTransaction.findAndCountAll({ where, offset, limit, order: [['created_at', 'DESC']] });
        res.json({ message: 'ok', total: count, page, limit, data: rows });
    } catch (e) {
        console.error('admin listPayments:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

// ---------- 店铺 ----------
const shopWritableFields = [
    'name', 'category', 'logo_url', 'cover_url', 'notice', 'delivery_type',
    'min_order_amount', 'delivery_fee', 'avg_delivery_minutes', 'rating',
    'is_open', 'is_active', 'sort_order', 'address', 'latitude', 'longitude',
    'contact_name', 'contact_phone', 'business_hours',
    'facade_image', 'interior_image', 'license_image'
];
exports.listShops = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = (page - 1) * limit;
        const where = {};
        if (req.query.category) where.category = req.query.category;
        if (req.query.is_active !== undefined && req.query.is_active !== '') where.is_active = parseInt(req.query.is_active, 10);
        if (req.query.keyword) {
            where[Op.or] = [{ name: { [Op.like]: `%${req.query.keyword}%` } }, { shop_no: { [Op.like]: `%${req.query.keyword}%` } }];
        }
        const { rows, count } = await MarketShop.findAndCountAll({ where, offset, limit, order: [['sort_order', 'DESC'], ['id', 'DESC']] });
        res.json({ message: 'ok', total: count, page, limit, data: rows });
    } catch (e) {
        console.error('admin listShops:', e);
        res.status(500).json({ error: '获取失败' });
    }
};
exports.getShop = async (req, res) => {
    try {
        const row = await MarketShop.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: '店铺不存在' });
        res.json({ message: 'ok', data: row });
    } catch (e) {
        console.error('admin getShop:', e);
        res.status(500).json({ error: '获取失败' });
    }
};
exports.createShop = async (req, res) => {
    try {
        const b = req.body || {};
        if (!b.name || !b.category) return res.status(400).json({ error: 'name、category 必填' });
        const body = { shop_no: genShopNo(), name: b.name, category: b.category };
        shopWritableFields.forEach(f => { if (b[f] !== undefined) body[f] = b[f]; });
        const row = await MarketShop.create(body);
        await logAdminAction(req, 'create_shop', 'market_shop', row.id, body);
        res.status(201).json({ message: '创建成功', data: row });
    } catch (e) {
        console.error('admin createShop:', e);
        res.status(500).json({ error: '创建失败' });
    }
};
exports.updateShop = async (req, res) => {
    try {
        const row = await MarketShop.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: '店铺不存在' });
        const b = req.body || {};
        shopWritableFields.forEach(f => { if (b[f] !== undefined) row[f] = b[f]; });
        await row.save();
        await logAdminAction(req, 'update_shop', 'market_shop', row.id, b);
        res.json({ message: '更新成功', data: row });
    } catch (e) {
        console.error('admin updateShop:', e);
        res.status(500).json({ error: '更新失败' });
    }
};

exports.deleteShopCascade = async (req, res) => {
    const tx = await sequelize.transaction();
    try {
        const shopId = parseInt(req.params.id, 10);
        if (!Number.isInteger(shopId) || shopId <= 0) {
            await tx.rollback();
            return res.status(400).json({ error: '无效店铺 ID' });
        }

        const adminPassword = req.body && req.body.admin_password !== undefined
            ? String(req.body.admin_password)
            : '';
        const expectedPassword = String(process.env.ADMIN_PASSWORD || '').trim();
        if (!expectedPassword) {
            await tx.rollback();
            return res.status(503).json({ error: '服务端未配置 ADMIN_PASSWORD，无法执行删除' });
        }
        if (!adminPassword || adminPassword !== expectedPassword) {
            await tx.rollback();
            return res.status(401).json({ error: '管理员密码错误' });
        }

        const row = await MarketShop.findByPk(shopId, { transaction: tx });
        if (!row) {
            await tx.rollback();
            return res.status(404).json({ error: '店铺不存在' });
        }

        const orderCount = await MarketOrder.count({ where: { shop_id: shopId }, transaction: tx });
        if (orderCount > 0) {
            await tx.rollback();
            return res.status(400).json({ error: '该店铺存在订单，禁止直接删除' });
        }

        const goodsRows = await MarketGood.findAll({
            where: { shop_id: shopId },
            attributes: ['id'],
            transaction: tx
        });
        const goodsIds = goodsRows.map(item => item.id);

        if (goodsIds.length > 0) {
            await MarketGood.destroy({
                where: { id: { [Op.in]: goodsIds } },
                transaction: tx
            });
        }

        await row.destroy({ transaction: tx });
        await tx.commit();

        await logAdminAction(req, 'delete_shop_cascade', 'market_shop', shopId, {
            goods_deleted: goodsIds.length
        });
        return res.json({
            message: '删除成功',
            data: { shop_id: shopId, goods_deleted: goodsIds.length }
        });
    } catch (e) {
        await tx.rollback();
        console.error('admin deleteShopCascade:', e);
        return res.status(500).json({ error: '删除失败' });
    }
};

// ---------- 商品 ----------
const goodWritableFields = [
    'category_key',
    'name',
    'description',
    'main_image',
    'images',
    'price',
    'origin_price',
    'stock',
    'status',
    'sort_order',
    'price_range',
    'desc_html'
];
exports.listGoods = async (req, res) => {
    try {
        const shopId = req.query.shop_id;
        if (!shopId) return res.status(400).json({ error: '缺少 shop_id' });
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = (page - 1) * limit;
        const where = { shop_id: shopId };
        if (req.query.status) where.status = req.query.status;
        const { rows, count } = await MarketGood.findAndCountAll({ where, offset, limit, order: [['sort_order', 'DESC'], ['id', 'DESC']] });
        res.json({ message: 'ok', total: count, page, limit, data: rows });
    } catch (e) {
        console.error('admin listGoods:', e);
        res.status(500).json({ error: '获取失败' });
    }
};
exports.createGood = async (req, res) => {
    try {
        const b = req.body || {};
        if (!b.shop_id || !b.category_key || !b.name || b.price === undefined) return res.status(400).json({ error: 'shop_id、category_key、name、price 必填' });
        const shop = await MarketShop.findByPk(b.shop_id);
        if (!shop) return res.status(400).json({ error: '店铺不存在' });
        const body = { shop_id: b.shop_id, goods_no: genGoodsNo(b.shop_id), category_key: b.category_key, name: b.name, price: b.price };
        goodWritableFields.forEach(f => { if (b[f] !== undefined && !['category_key', 'name', 'price'].includes(f)) body[f] = b[f]; });
        const row = await MarketGood.create(body);
        await logAdminAction(req, 'create_good', 'market_good', row.id, body);
        res.status(201).json({ message: '创建成功', data: row });
    } catch (e) {
        console.error('admin createGood:', e);
        res.status(500).json({ error: '创建失败' });
    }
};
exports.updateGood = async (req, res) => {
    try {
        const row = await MarketGood.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: '商品不存在' });
        const b = req.body || {};
        goodWritableFields.forEach(f => { if (b[f] !== undefined) row[f] = b[f]; });
        await row.save();
        await logAdminAction(req, 'update_good', 'market_good', row.id, b);
        res.json({ message: '更新成功', data: row });
    } catch (e) {
        console.error('admin updateGood:', e);
        res.status(500).json({ error: '更新失败' });
    }
};
exports.batchUpdateGoods = async (req, res) => {
    try {
        const { ids, changes } = req.body || {};
        if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids 不能为空' });
        const allow = ['status', 'price', 'stock', 'sort_order'];
        const payload = {};
        allow.forEach(k => { if (changes && changes[k] !== undefined) payload[k] = changes[k]; });
        if (Object.keys(payload).length === 0) return res.status(400).json({ error: 'changes 无有效字段' });
        const [affected] = await MarketGood.update(payload, { where: { id: { [Op.in]: ids } } });
        await logAdminAction(req, 'batch_update_goods', 'market_good', `${ids.length}`, { ids, payload });
        res.json({ message: '批量更新成功', data: { affected } });
    } catch (e) {
        console.error('admin batchUpdateGoods:', e);
        res.status(500).json({ error: '更新失败' });
    }
};
exports.lowStockGoods = async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold, 10) || 10;
        const rows = await MarketGood.findAll({ where: { stock: { [Op.lte]: threshold } }, order: [['stock', 'ASC']], limit: 500 });
        res.json({ message: 'ok', data: rows });
    } catch (e) {
        console.error('admin lowStockGoods:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

// ---------- 入驻申请 ----------
exports.listMarketApplications = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = (page - 1) * limit;
        const where = {};
        if (req.query.status) where.status = req.query.status;
        const { rows, count } = await MarketApplication.findAndCountAll({
            where, offset, limit, order: [['created_at', 'DESC']],
            include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'phone'], required: false }]
        });
        res.json({ message: 'ok', total: count, page, limit, data: rows });
    } catch (e) {
        console.error('admin listMarketApplications:', e);
        res.status(500).json({ error: '获取失败' });
    }
};
exports.updateMarketApplication = async (req, res) => {
    try {
        const { status, note } = req.body || {};
        if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'status 须为 approved 或 rejected' });
        const row = await MarketApplication.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: '申请不存在' });
        const fromStatus = row.status;
        row.status = status;
        await row.save();
        let shop = null;
        if (status === 'approved') {
            shop = await MarketShop.findOne({
                where: { name: row.shop_name, contact_phone: row.phone },
                order: [['id', 'DESC']]
            });
            if (!shop) {
                const placeList = Array.isArray(row.place_photo_url) ? row.place_photo_url : [];
                shop = await MarketShop.create({
                    shop_no: genShopNo(),
                    name: row.shop_name,
                    category: row.category,
                    logo_url: row.logo_url || null,
                    cover_url: row.background_url || null,
                    notice: row.description || null,
                    address: row.address || null,
                    contact_name: row.contact_name || null,
                    contact_phone: row.phone || null,
                    facade_image: placeList[0] || null,
                    interior_image: placeList[1] || null,
                    license_image: row.license_url || null,
                    is_open: 1,
                    is_active: 1
                });
            } else {
                const changed = {};
                if (!shop.logo_url && row.logo_url) changed.logo_url = row.logo_url;
                if (!shop.cover_url && row.background_url) changed.cover_url = row.background_url;
                if (!shop.license_image && row.license_url) changed.license_image = row.license_url;
                if (!shop.address && row.address) changed.address = row.address;
                if (!shop.contact_name && row.contact_name) changed.contact_name = row.contact_name;
                if (!shop.contact_phone && row.phone) changed.contact_phone = row.phone;
                if (Object.keys(changed).length) await shop.update(changed);
            }
        }
        await writeApproval('market_application', row.id, fromStatus, status, (req.admin && req.admin.sub) || 'admin', note);
        res.json({ message: '操作成功', data: { ...row.get({ plain: true }), shop_id: shop ? shop.id : null } });
    } catch (e) {
        console.error('admin updateMarketApplication:', e);
        res.status(500).json({ error: '操作失败' });
    }
};
exports.listServiceProviderApplications = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = (page - 1) * limit;
        const where = {};
        if (req.query.status) where.status = req.query.status;
        const include = [];
        // 兼容精简运行环境：User 模型/关联缺失时不阻断主列表查询
        if (
            User &&
            ServiceProviderApplication &&
            ServiceProviderApplication.associations &&
            ServiceProviderApplication.associations.user
        ) {
            include.push({ model: User, as: 'user', attributes: ['id', 'nickname', 'phone'], required: false });
        }
        const { rows, count } = await ServiceProviderApplication.findAndCountAll({
            where, offset, limit, order: [['created_at', 'DESC']],
            include
        });
        res.json({ message: 'ok', total: count, page, limit, data: rows });
    } catch (e) {
        console.error('admin listServiceProviderApplications:', e);
        res.status(500).json({ error: '获取失败' });
    }
};
exports.updateServiceProviderApplication = async (req, res) => {
    try {
        const { status, note, community_id } = req.body || {};
        if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'status 须为 approved 或 rejected' });
        const row = await ServiceProviderApplication.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: '申请不存在' });
        const fromStatus = row.status;
        row.status = status;
        await row.save();
        if (status === 'approved') {
            const commId = community_id != null && community_id !== '' ? parseInt(community_id, 10) : null;
            await ServiceProviderProfile.upsert({
                user_id: row.user_id,
                application_id: row.id,
                shop_name: row.shop_name,
                contact_name: row.contact_name,
                phone: row.phone,
                license_url: row.license_url,
                shop_front_url: row.shop_front_url || null,
                environment_url: row.environment_url || null,
                id_card_url: row.id_card_url,
                certificate_url: row.certificate_url || null,
                community_id: Number.isFinite(commId) ? commId : null,
                status: 'active'
            });
            const user = await User.findByPk(row.user_id);
            if (user && !user.phone && row.phone) {
                user.phone = row.phone;
                await user.save();
            }
        } else if (fromStatus === 'approved') {
            const profile = await ServiceProviderProfile.findOne({ where: { application_id: row.id } });
            if (profile) await profile.update({ status: 'inactive' });
        }
        await writeApproval('service_provider_application', row.id, fromStatus, status, (req.admin && req.admin.sub) || 'admin', note);
        await logAdminAction(req, 'update_service_provider_application', 'service_provider_application', row.id, { fromStatus, toStatus: status, note: note || '' });
        res.json({ message: 'ok', data: row });
    } catch (e) {
        console.error('admin updateServiceProviderApplication:', e);
        res.status(500).json({ error: '更新服务商申请失败' });
    }
};

/** POST body: profile_id, username, password — 为已审核服务商开通运行中台登录 */
exports.createServiceProviderPortalAccount = async (req, res) => {
    try {
        const { profile_id, username, password } = req.body || {};
        const pid = parseInt(profile_id, 10);
        if (!pid || !username || !password) {
            return res.status(400).json({ error: '请提供 profile_id、username、password' });
        }
        const prof = await ServiceProviderProfile.findByPk(pid);
        if (!prof || prof.status !== 'active') {
            return res.status(404).json({ error: '服务商档案不存在或未激活' });
        }
        const un = String(username).trim();
        const dup = await ServiceProviderPortalAccount.findOne({ where: { username: un } });
        if (dup) return res.status(400).json({ error: '用户名已存在' });
        const dupProf = await ServiceProviderPortalAccount.findOne({ where: { profile_id: pid } });
        if (dupProf) return res.status(400).json({ error: '该服务商已开通门户账号' });
        await ServiceProviderPortalAccount.create({
            profile_id: pid,
            username: un,
            password_hash: hashSpPortalPassword(password),
            status: 'active',
            role: 'owner'
        });
        await logAdminAction(req, 'create_service_provider_portal_account', 'service_provider_profile', pid, { username: un });
        res.json({ message: 'ok' });
    } catch (e) {
        console.error('admin createServiceProviderPortalAccount:', e);
        res.status(500).json({ error: '创建失败' });
    }
};

// ---------- 评价 ----------
exports.listReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = (page - 1) * limit;
        const where = {};
        if (req.query.shop_id) where.shop_id = req.query.shop_id;
        const { rows, count } = await MarketShopReview.findAndCountAll({ where, offset, limit, order: [['created_at', 'DESC']] });
        res.json({ message: 'ok', total: count, page, limit, data: rows });
    } catch (e) {
        console.error('admin listReviews:', e);
        res.status(500).json({ error: '获取失败' });
    }
};
exports.deleteReview = async (req, res) => {
    try {
        const row = await MarketShopReview.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: '评价不存在' });
        await row.destroy();
        await logAdminAction(req, 'delete_review', 'market_shop_review', req.params.id);
        res.json({ message: '已删除' });
    } catch (e) {
        console.error('admin deleteReview:', e);
        res.status(500).json({ error: '删除失败' });
    }
};

// ========== 直约服务商 管理 ==========

exports.listServiceProviders = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = (page - 1) * limit;
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.community_id) where.community_id = parseInt(req.query.community_id, 10);
        const { rows, count } = await ServiceProviderProfile.findAndCountAll({
            where, offset, limit,
            order: [['created_at', 'DESC']],
            include: [
                { model: User, as: 'user', attributes: ['id', 'nickname', 'phone'], required: false }
            ]
        });
        // attach service count
        const ids = rows.map(r => r.id);
        let svcMap = {};
        if (ids.length) {
            const svcs = await Service.findAll({
                where: { provider_id: ids },
                attributes: ['provider_id', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']],
                group: ['provider_id'],
                raw: true
            });
            svcs.forEach(s => { svcMap[s.provider_id] = parseInt(s.cnt, 10); });
        }
        const data = rows.map(r => ({ ...r.toJSON(), service_count: svcMap[r.id] || 0 }));
        res.json({ message: 'ok', total: count, page, limit, data });
    } catch (e) {
        console.error('admin listServiceProviders:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.getServiceProvider = async (req, res) => {
    try {
        const row = await ServiceProviderProfile.findByPk(req.params.id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'nickname', 'phone'], required: false }
            ]
        });
        if (!row) return res.status(404).json({ error: '服务商不存在' });
        const services = await Service.findAll({
            where: { provider_id: row.id },
            order: [['id', 'DESC']]
        });
        res.json({ message: 'ok', data: { ...row.toJSON(), services } });
    } catch (e) {
        console.error('admin getServiceProvider:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.updateServiceProvider = async (req, res) => {
    try {
        const row = await ServiceProviderProfile.findByPk(req.params.id);
        if (!row) return res.status(404).json({ error: '服务商不存在' });
        const allowed = ['shop_name', 'contact_name', 'phone', 'status', 'community_id',
                         'shop_front_url', 'license_url', 'environment_url', 'description'];
        const updates = {};
        allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
        await row.update(updates);
        await logAdminAction(req, 'update_service_provider', 'service_provider_profile', row.id, updates);
        res.json({ message: 'ok', data: row });
    } catch (e) {
        console.error('admin updateServiceProvider:', e);
        res.status(500).json({ error: '更新失败' });
    }
};

exports.createServiceProvider = async (req, res) => {
    try {
        const { shop_name, contact_name, phone, community_id, user_id } = req.body || {};
        if (!shop_name) return res.status(400).json({ error: '请填写店铺名称' });
        const row = await ServiceProviderProfile.create({
            shop_name, contact_name: contact_name || '',
            phone: phone || '',
            community_id: community_id ? parseInt(community_id, 10) : null,
            user_id: user_id ? parseInt(user_id, 10) : null,
            status: 'active'
        });
        await logAdminAction(req, 'create_service_provider', 'service_provider_profile', row.id, { shop_name });
        res.json({ message: 'ok', data: row });
    } catch (e) {
        console.error('admin createServiceProvider:', e);
        res.status(500).json({ error: '创建失败' });
    }
};

exports.listSpServices = async (req, res) => {
    try {
        const providerId = parseInt(req.params.id, 10);
        const rows = await Service.findAll({
            where: { provider_id: providerId },
            order: [['id', 'DESC']]
        });
        res.json({ message: 'ok', data: rows });
    } catch (e) {
        console.error('admin listSpServices:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.listAllSpServices = async (req, res) => {
    try {
        const rows = await Service.findAll({
            order: [['id', 'DESC']]
        });
        res.json({ message: 'ok', data: rows });
    } catch (e) {
        console.error('admin listAllSpServices:', e);
        res.status(500).json({ error: '获取失败' });
    }
};

exports.createSpService = async (req, res) => {
    try {
        const providerId = parseInt(req.params.id, 10);
        const prof = await ServiceProviderProfile.findByPk(providerId);
        if (!prof) return res.status(404).json({ error: '服务商不存在' });
        const { title, sub_title, description, price, unit, cover_image, category_key, is_published } = req.body || {};
        if (!title) return res.status(400).json({ error: '请填写服务名称' });
        const row = await Service.create({
            title, sub_title: sub_title || '',
            description: description || '',
            price: parseFloat(price) || 0,
            unit: unit || '次',
            cover_image: cover_image || '',
            category_key: category_key || 'general',
            provider_id: providerId,
            is_published: is_published !== undefined ? (is_published ? 1 : 0) : 1
        });
        await logAdminAction(req, 'create_sp_service', 'service', row.id, { provider_id: providerId, title });
        res.json({ message: 'ok', data: row });
    } catch (e) {
        console.error('admin createSpService:', e);
        res.status(500).json({ error: '创建失败' });
    }
};

exports.updateSpService = async (req, res) => {
    try {
        const row = await Service.findOne({
            where: { id: req.params.sid, provider_id: req.params.id }
        });
        if (!row) return res.status(404).json({ error: '服务不存在' });
        const allowed = ['title', 'sub_title', 'description', 'price', 'unit', 'cover_image', 'category_key', 'is_published'];
        const updates = {};
        allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
        await row.update(updates);
        await logAdminAction(req, 'update_sp_service', 'service', row.id, updates);
        res.json({ message: 'ok', data: row });
    } catch (e) {
        console.error('admin updateSpService:', e);
        res.status(500).json({ error: '更新失败' });
    }
};

exports.deleteSpService = async (req, res) => {
    try {
        const row = await Service.findOne({
            where: { id: req.params.sid, provider_id: req.params.id }
        });
        if (!row) return res.status(404).json({ error: '服务不存在' });
        await row.update({ is_published: 0 });
        await logAdminAction(req, 'archive_sp_service', 'service', row.id, {});
        res.json({ message: '已下架' });
    } catch (e) {
        console.error('admin deleteSpService:', e);
        res.status(500).json({ error: '操作失败' });
    }
};

exports.listSpOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const offset = (page - 1) * limit;
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.provider_id) where.provider_user_id = req.query.provider_id;
        const { rows, count } = await ServiceOrder.findAndCountAll({
            where, offset, limit,
            order: [['created_at', 'DESC']],
            include: [
                { model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'], required: false },
                { model: Service, as: 'service', attributes: ['id', 'title', 'price'], required: false }
            ]
        });
        res.json({ message: 'ok', total: count, page, limit, data: rows });
    } catch (e) {
        console.error('admin listSpOrders:', e);
        res.status(500).json({ error: '获取失败' });
    }
};
