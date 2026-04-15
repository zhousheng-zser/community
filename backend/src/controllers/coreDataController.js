const { Op, QueryTypes } = require('sequelize');
const {
  Category,
  Service,
  Banner,
  Good,
  User,
  WorkerApplication,
  WorkerProfile,
  ServiceProviderProfile,
  HousekeepingDispatch,
  sequelize,
  MarketShop
} = require('../models');

const ok = (res, data) => res.json({ errno: 0, data });
const fail = (res, errno, errmsg, httpStatus = 200) => res.status(httpStatus).json({ errno, errmsg });

const SERVICE_GROUP_KEYS = new Set([
  'tidy', 'urgent_fix', 'appliance_clean', 'pioneer_clean', 'mite_remove',
  'furniture_care', 'baby_home', 'house_repair', 'beauty_home'
]);

const GROUP_META = {
  tidy: { title: '整理收纳', price_unit: '份' },
  urgent_fix: { title: '家修急事', price_unit: '次' },
  appliance_clean: { title: '家电清洗', price_unit: '次' },
  pioneer_clean: { title: '开荒保洁', price_unit: '次' },
  mite_remove: { title: '除螨服务', price_unit: '次' },
  furniture_care: { title: '家具养护', price_unit: '次' },
  baby_home: { title: '宝宝家事', price_unit: '次' },
  house_repair: { title: '房屋修缮', price_unit: '次' },
  beauty_home: { title: '上门美业', price_unit: '次' }
};

function firstBy(rows, key) {
  const map = {};
  rows.forEach((row) => {
    const k = row[key];
    if (k == null || map[k]) return;
    map[k] = row;
  });
  return map;
}

function isPublishedService(j) {
  const v = j.is_published;
  if (v === undefined || v === null) return true;
  return v === 1 || v === true;
}

/** 已上架：未显式下架（兼容未迁移 is_published 的旧行） */
function publishedWhere() {
  return {
    [Op.or]: [
      { is_published: { [Op.is]: null } },
      { is_published: 1 },
      { is_published: true }
    ]
  };
}

function normalizeServiceRow(s) {
  const j = s && typeof s.toJSON === 'function' ? s.toJSON() : s;
  const cat = j.category || {};
  const price = Number(j.price);
  return {
    id: j.id,
    title: j.title,
    price: Number.isFinite(price) ? Math.round(price * 100) / 100 : j.price,
    cover_image: j.cover_image || null,
    sales_count: j.sales_count != null ? Number(j.sales_count) : 0,
    category: cat.name ? { name: cat.name } : null
  };
}

function buildWorkerCard(user, profile, approvedApp, dispatchCount) {
  const realName = (profile && profile.real_name) || (approvedApp && approvedApp.name) || user.nickname || `用户${user.id}`;
  const industry = (profile && profile.industry) || (approvedApp && approvedApp.industry) || '未填写';
  const city = (profile && profile.city) || (approvedApp && approvedApp.city) || '';
  const resume = (profile && profile.resume) || (approvedApp && approvedApp.resume) || '';
  const workPhoto = (profile && profile.work_photo_url) || (approvedApp && approvedApp.work_photo_url) || '';
  const count = Number(dispatchCount || 0);
  const avatar = (profile && profile.work_photo_url) || user.avatar_url || workPhoto || '';
  return {
    id: user.id,
    name: realName,
    real_name: realName,
    nickname: user.nickname || realName,
    avatar: user.avatar_url || '',
    avatar_url: user.avatar_url || avatar || '',
    skill: industry,
    industry,
    region: city,
    city,
    desc: resume,
    resume,
    workPhoto,
    orders: count,
    serviceCount: count,
    service_count: count,
    exp: 0,
    work_years: 0,
    tags: industry ? [industry] : []
  };
}

async function getApprovedActiveWorkerUserIds() {
  const approved = await WorkerApplication.findAll({
    where: { status: 'approved' },
    attributes: ['user_id'],
    raw: true
  });
  const uidSet = [...new Set(approved.map((r) => r.user_id))];
  if (uidSet.length === 0) return [];
  const profiles = await WorkerProfile.findAll({
    where: { user_id: { [Op.in]: uidSet }, status: 'active' },
    attributes: ['user_id'],
    raw: true
  });
  return [...new Set(profiles.map((p) => p.user_id))];
}

async function assertWorkerListable(userId) {
  const app = await WorkerApplication.findOne({ where: { user_id: userId, status: 'approved' } });
  const prof = await WorkerProfile.findOne({ where: { user_id: userId, status: 'active' } });
  return !!(app && prof);
}

const HOT_ORDER_STATUSES = ['paid_pending_dispatch', 'dispatched', 'in_service', 'completed'];

exports.getBanners = async (req, res) => {
  try {
    const scene = req.query.scene || 'home';
    const where = { [Op.or]: [{ scene }, { scene: null }] };
    const banners = await Banner.findAll({
      where,
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });
    const data = banners.map((b) => {
      const j = b.toJSON();
      const linkType = j.link_type || (j.target_url ? 'h5' : 'none');
      const linkValue = j.link_value != null && j.link_value !== '' ? j.link_value : (j.target_url || '');
      return {
        id: j.id,
        image_url: j.image_url,
        sort_order: j.sort_order,
        link_type: linkType,
        link_value: linkValue,
        scene: j.scene || 'home'
      };
    });
    return ok(res, data);
  } catch (e) {
    console.error('getBanners', e);
    return fail(res, 500, '服务异常');
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['sort_order', 'ASC']] });
    return ok(res, categories);
  } catch (e) {
    return fail(res, 500, '服务异常');
  }
};

exports.getHotServices = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit, 10);
    if (!Number.isFinite(limit) || limit < 1) limit = 10;
    limit = Math.min(limit, 20);
    const categoryId = req.query.category_id ? parseInt(req.query.category_id, 10) : null;
    const where = { ...publishedWhere() };
    if (categoryId) where.category_id = categoryId;
    const services = await Service.findAll({
      where,
      limit,
      order: [['sales_count', 'DESC'], ['id', 'DESC']],
      include: [{ model: Category, as: 'category', attributes: ['name'] }]
    });
    return ok(res, services.map(normalizeServiceRow));
  } catch (e) {
    console.error('getHotServices', e);
    return fail(res, 500, '服务异常');
  }
};

exports.listServices = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let limit = parseInt(req.query.limit, 10) || 10;
    limit = Math.min(Math.max(limit, 1), 50);
    const offset = (page - 1) * limit;
    const categoryId = req.query.category_id ? parseInt(req.query.category_id, 10) : null;
    const where = { ...publishedWhere() };
    if (categoryId) where.category_id = categoryId;
    const { rows, count } = await Service.findAndCountAll({
      where,
      offset,
      limit,
      order: [['sales_count', 'DESC'], ['id', 'DESC']],
      include: [{ model: Category, as: 'category', attributes: ['name'] }]
    });
    return ok(res, { list: rows.map(normalizeServiceRow), total: count, page, limit });
  } catch (e) {
    console.error('listServices', e);
    return fail(res, 500, '服务异常');
  }
};

exports.getServicesByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { rows, count } = await Service.findAndCountAll({
      where: { category_id: categoryId, ...publishedWhere() },
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      include: [{ model: Category, as: 'category', attributes: ['name'] }]
    });
    return ok(res, { list: rows.map(normalizeServiceRow), total: count, page, limit });
  } catch (e) {
    return fail(res, 500, '服务异常');
  }
};

exports.getServiceDetail = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category', attributes: ['name', 'icon_url'] }]
    });
    if (!service) return fail(res, 404, '不存在', 404);
    const j = service.toJSON();
    if (!isPublishedService(j)) return fail(res, 404, '不存在', 404);
    const base = normalizeServiceRow(service);
    return ok(res, {
      ...base,
      description: j.description || null,
      detail_images: j.detail_images || [],
      tags: j.tags || [],
      sub_title: j.sub_title || null,
      order_count: j.order_count != null ? j.order_count : j.sales_count || 0
    });
  } catch (e) {
    return fail(res, 500, '服务异常');
  }
};

exports.getServiceGroup = async (req, res) => {
  try {
    const key = String(req.params.group || '').trim();
    if (!SERVICE_GROUP_KEYS.has(key)) return fail(res, 400, '无效的服务分组 key');
    const meta = GROUP_META[key] || { title: key, price_unit: '次' };
    const categories = await Category.findAll({
      where: { group_type: key },
      order: [['sort_order', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'name', 'icon_url', 'sort_order']
    });
    const categoryIds = categories.map((c) => c.id);
    const services = categoryIds.length === 0 ? [] : await Service.findAll({
      where: {
        category_id: { [Op.in]: categoryIds },
        ...publishedWhere()
      },
      include: [{ model: Category, as: 'category', attributes: ['name'] }],
      order: [['sales_count', 'DESC'], ['id', 'ASC']]
    });
    const catPayload = categories.map((c) => {
      const x = c.toJSON();
      return { name: x.name, icon_url: x.icon_url || null, sort_order: x.sort_order != null ? x.sort_order : 0 };
    });
    return ok(res, {
      title: meta.title,
      price_unit: meta.price_unit,
      categories: catPayload,
      services: services.map(normalizeServiceRow)
    });
  } catch (e) {
    console.error('getServiceGroup', e);
    return fail(res, 500, '服务异常');
  }
};

exports.getWorkers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    let pageSize = parseInt(req.query.page_size, 10) || 20;
    pageSize = Math.min(Math.max(pageSize, 1), 50);
    const eligibleIds = await getApprovedActiveWorkerUserIds();
    if (eligibleIds.length === 0) return ok(res, { list: [], total: 0, page, page_size: pageSize });

    const whereUser = { id: { [Op.in]: eligibleIds } };
    const { rows: users, count } = await User.findAndCountAll({
      where: whereUser,
      attributes: ['id', 'nickname', 'avatar_url', 'phone'],
      order: [['id', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
    const ids = users.map((u) => u.id);
    if (ids.length === 0) return ok(res, { list: [], total: count, page, page_size: pageSize });

    const profiles = await WorkerProfile.findAll({ where: { user_id: { [Op.in]: ids } }, order: [['updated_at', 'DESC']] });
    const approvedApps = await WorkerApplication.findAll({ where: { user_id: { [Op.in]: ids }, status: 'approved' }, order: [['updated_at', 'DESC']] });
    const dispatchCounts = await HousekeepingDispatch.findAll({
      attributes: ['worker_id', [HousekeepingDispatch.sequelize.fn('COUNT', HousekeepingDispatch.sequelize.col('id')), 'cnt']],
      where: { worker_id: { [Op.in]: ids } },
      group: ['worker_id']
    });
    const profileMap = firstBy(profiles, 'user_id');
    const appMap = firstBy(approvedApps, 'user_id');
    const countMap = {};
    dispatchCounts.forEach((row) => { countMap[row.worker_id] = Number(row.get('cnt') || 0); });

    const list = users.map((u) => buildWorkerCard(u, profileMap[u.id], appMap[u.id], countMap[u.id] || 0));
    return ok(res, { list, total: count, page, page_size: pageSize });
  } catch (e) {
    console.error('getWorkers', e);
    return fail(res, 500, '服务异常', 500);
  }
};

exports.getWorkerDetail = async (req, res) => {
  try {
    const workerId = Number(req.params.id);
    if (!workerId) return fail(res, 400, '无效技工 id');
    const listable = await assertWorkerListable(workerId);
    if (!listable) return fail(res, 404, '不存在', 404);
    const user = await User.findByPk(workerId, { attributes: ['id', 'nickname', 'avatar_url', 'phone', 'role'] });
    if (!user) return fail(res, 404, '不存在', 404);
    const profile = await WorkerProfile.findOne({ where: { user_id: workerId, status: 'active' }, order: [['updated_at', 'DESC']] });
    const approvedApp = await WorkerApplication.findOne({ where: { user_id: workerId, status: 'approved' }, order: [['updated_at', 'DESC']] });
    const dispatchCount = await HousekeepingDispatch.count({ where: { worker_id: workerId } });
    return ok(res, buildWorkerCard(user, profile, approvedApp, dispatchCount));
  } catch (e) {
    console.error('getWorkerDetail', e);
    return fail(res, 500, '服务异常');
  }
};

exports.getServiceProviders = async (req, res) => {
  try {
    const rows = await ServiceProviderProfile.findAll({
      where: { status: 'active' },
      include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'avatar_url', 'phone'], required: false }],
      order: [['updated_at', 'DESC']],
      limit: 12
    });
    const data = rows.map((row) => ({
      id: row.user_id,
      profile_id: row.id,
      name: row.shop_name,
      shop_name: row.shop_name,
      contact_name: row.contact_name,
      phone: row.phone,
      avatar: (row.user && row.user.avatar_url) || row.shop_front_url || '',
      avatar_url: (row.user && row.user.avatar_url) || row.shop_front_url || '',
      cover_image: row.shop_front_url || '',
      environment_url: row.environment_url || [],
      certificate_url: row.certificate_url || [],
      status: row.status,
      description: `${row.shop_name} · ${row.contact_name}`
    }));
    return ok(res, data);
  } catch (e) {
    console.error('getServiceProviders', e);
    return fail(res, 500, '服务异常');
  }
};

exports.getServiceProviderDetail = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) return fail(res, 400, '无效 id');
    const row = await ServiceProviderProfile.findOne({
      where: { user_id: userId, status: 'active' },
      include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'avatar_url', 'phone'], required: false }],
      order: [['updated_at', 'DESC']]
    });
    if (!row) return fail(res, 404, '不存在', 404);
    return ok(res, {
      id: row.user_id,
      profile_id: row.id,
      name: row.shop_name,
      shop_name: row.shop_name,
      contact_name: row.contact_name,
      phone: row.phone,
      avatar: (row.user && row.user.avatar_url) || row.shop_front_url || '',
      avatar_url: (row.user && row.user.avatar_url) || row.shop_front_url || '',
      cover_image: row.shop_front_url || '',
      environment_url: row.environment_url || [],
      certificate_url: row.certificate_url || [],
      license_url: row.license_url,
      status: row.status,
      description: `${row.shop_name} · ${row.contact_name}`
    });
  } catch (e) {
    console.error('getServiceProviderDetail', e);
    return fail(res, 500, '服务异常');
  }
};

exports.getFeaturedGoods = async (req, res) => {
  try {
    const whereFeatured = { is_featured: { [Op.or]: [1, true] } };
    let goods = [];
    try {
      goods = await Good.findAll({
        where: whereFeatured,
        order: [['featured_sort', 'ASC'], ['id', 'DESC']],
        limit: 24
      });
    } catch (e) {
      goods = [];
    }
    if (goods.length === 0) {
      goods = await Good.findAll({ limit: 6, order: [['createdAt', 'DESC']] });
    }
    const data = goods.map((g) => {
      const j = g.toJSON();
      return {
        id: j.id,
        title: j.title,
        goodsTitle: j.title,
        name: j.title,
        price: j.price,
        goodsRealPrice: j.price,
        mainPicture: j.cover_image,
        cover_image: j.cover_image,
        image: j.cover_image,
        unit: j.unit || ''
      };
    });
    return ok(res, data);
  } catch (e) {
    console.error('getFeaturedGoods', e);
    return fail(res, 500, '服务异常');
  }
};

exports.getGoodDetail = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return fail(res, 400, '无效商品 id');
    const g = await Good.findByPk(id);
    if (!g) return fail(res, 404, '不存在', 404);
    const j = g.toJSON();
    return ok(res, {
      id: j.id,
      title: j.title,
      goodsTitle: j.title,
      name: j.title,
      price: j.price,
      goodsRealPrice: j.price,
      mainPicture: j.cover_image,
      cover_image: j.cover_image,
      image: j.cover_image,
      unit: j.unit || '',
      detail_images: j.detail_images || [],
      stock: j.stock,
      tab_category: j.tab_category
    });
  } catch (e) {
    console.error('getGoodDetail', e);
    return fail(res, 500, '服务异常');
  }
};

exports.getCommunityHot = async (req, res) => {
  try {
    let communityId = req.query.community_id ? parseInt(req.query.community_id, 10) : null;
    if (!communityId && req.user && req.user.id) {
      const u = await User.findByPk(req.user.id, { attributes: ['community_id'] });
      communityId = u && u.community_id ? Number(u.community_id) : null;
    }
    if (!communityId) return fail(res, 400, '请传 community_id 或登录后绑定默认小区');

    let days = parseInt(req.query.days, 10) || 30;
    days = Math.min(Math.max(days, 1), 365);
    let limit = parseInt(req.query.limit, 10) || 10;
    limit = Math.min(Math.max(limit, 1), 50);
    const type = (req.query.type || 'service').toLowerCase();

    const servicesOut = [];
    const shopsOut = [];

    if (type === 'service' || type === 'all') {
      const statusList = HOT_ORDER_STATUSES.map((s) => sequelize.escape(s)).join(',');
      const svcRows = await sequelize.query(
        `SELECT o.service_id AS sid, COUNT(*) AS cnt
         FROM service_orders o
         WHERE o.community_id = :cid
           AND o.created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
           AND o.status IN (${statusList})
         GROUP BY o.service_id
         ORDER BY cnt DESC
         LIMIT ${limit}`,
        { replacements: { cid: communityId }, type: QueryTypes.SELECT }
      );
      const ranked = Array.isArray(svcRows) ? svcRows : [];
      let rank = 1;
      for (const row of ranked) {
        const sid = row.sid != null ? row.sid : row.SID;
        const svc = await Service.findByPk(sid, { include: [{ model: Category, as: 'category', attributes: ['name'] }] });
        if (!svc || !isPublishedService(svc.toJSON())) continue;
        const n = normalizeServiceRow(svc);
        servicesOut.push({
          item_type: 'service',
          id: n.id,
          title: n.title,
          price: n.price,
          cover_image: n.cover_image,
          order_count_in_community: Number(row.cnt),
          rank: rank++
        });
      }
    }

    if (type === 'shop' || type === 'all') {
      const shopRows = await sequelize.query(
        `SELECT o.shop_id AS sid, COUNT(*) AS cnt
         FROM market_orders o
         WHERE o.community_id = :cid
           AND o.created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
           AND o.pay_status IN ('paid','refund_pending')
           AND o.order_status IN ('paid','delivering','completed')
         GROUP BY o.shop_id
         ORDER BY cnt DESC
         LIMIT ${limit}`,
        { replacements: { cid: communityId }, type: QueryTypes.SELECT }
      );
      const ranked = Array.isArray(shopRows) ? shopRows : [];
      let rank = 1;
      for (const row of ranked) {
        const shopId = row.sid != null ? row.sid : row.SID;
        const shop = await MarketShop.findByPk(shopId);
        if (!shop || !shop.is_active) continue;
        const j = shop.toJSON();
        shopsOut.push({
          item_type: 'shop',
          id: j.id,
          name: j.name,
          cover_image: j.cover_url || j.logo_url || j.facade_image || null,
          order_count_in_community: Number(row.cnt),
          rank: rank++
        });
      }
    }

    return ok(res, { services: servicesOut, shops: shopsOut });
  } catch (e) {
    console.error('getCommunityHot', e);
    return fail(res, 500, '服务异常');
  }
};
