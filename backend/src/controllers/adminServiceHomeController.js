const { Op } = require('sequelize');
const { ServiceHomeModule, Category, Service } = require('../models');

const ok = (res, data) => res.json({ errno: 0, data });
const fail = (res, errno, errmsg, httpStatus = 200) => res.status(httpStatus).json({ errno, errmsg });

const GROUP_KEY_RE = /^[a-z][a-z0-9_]{0,62}$/;

function parseId(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

exports.listModules = async (req, res) => {
  try {
    const rows = await ServiceHomeModule.findAll({
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });
    return ok(res, rows.map((r) => r.toJSON()));
  } catch (e) {
    console.error('admin listModules', e);
    return fail(res, 500, '查询失败');
  }
};

exports.createModule = async (req, res) => {
  try {
    const body = req.body || {};
    const group_key = String(body.group_key || '').trim();
    const title = String(body.title || '').trim();
    if (!GROUP_KEY_RE.test(group_key)) {
      return fail(res, 400, 'group_key 须为小写字母开头的英文、数字或下划线');
    }
    if (!title) return fail(res, 400, '请填写模块标题');
    const dup = await ServiceHomeModule.findOne({ where: { group_key } });
    if (dup) return fail(res, 400, 'group_key 已存在');
    const row = await ServiceHomeModule.create({
      group_key,
      title,
      price_unit: body.price_unit != null && String(body.price_unit).trim() ? String(body.price_unit).trim() : '次',
      icon_url: body.icon_url != null && String(body.icon_url).trim() ? String(body.icon_url).trim() : null,
      sort_order: body.sort_order != null ? parseInt(body.sort_order, 10) || 0 : 0,
      is_active: body.is_active === undefined || body.is_active === 1 || body.is_active === true ? 1 : 0
    });
    return ok(res, row.toJSON());
  } catch (e) {
    console.error('admin createModule', e);
    return fail(res, 500, '创建失败');
  }
};

exports.updateModule = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, '无效 id');
    const row = await ServiceHomeModule.findByPk(id);
    if (!row) return fail(res, 404, '不存在', 404);
    const body = req.body || {};
    if (body.title != null) {
      const t = String(body.title).trim();
      if (!t) return fail(res, 400, '标题不能为空');
      row.title = t;
    }
    if (body.price_unit != null) row.price_unit = String(body.price_unit).trim() || '次';
    if (body.icon_url !== undefined) {
      row.icon_url = body.icon_url != null && String(body.icon_url).trim() ? String(body.icon_url).trim() : null;
    }
    if (body.sort_order != null) row.sort_order = parseInt(body.sort_order, 10) || 0;
    if (body.is_active !== undefined) row.is_active = body.is_active === 1 || body.is_active === true ? 1 : 0;
    await row.save();
    return ok(res, row.toJSON());
  } catch (e) {
    console.error('admin updateModule', e);
    return fail(res, 500, '更新失败');
  }
};

exports.deleteModule = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, '无效 id');
    const row = await ServiceHomeModule.findByPk(id);
    if (!row) return fail(res, 404, '不存在', 404);
    await row.destroy();
    return ok(res, { ok: true });
  } catch (e) {
    console.error('admin deleteModule', e);
    return fail(res, 500, '删除失败');
  }
};

exports.listCategories = async (req, res) => {
  try {
    const gk = String(req.query.group_key || '').trim();
    if (!gk) return fail(res, 400, '缺少 group_key');
    const rows = await Category.findAll({
      where: { group_type: gk },
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });
    return ok(res, rows.map((r) => r.toJSON()));
  } catch (e) {
    console.error('admin listCategories', e);
    return fail(res, 500, '查询失败');
  }
};

exports.createCategory = async (req, res) => {
  try {
    const body = req.body || {};
    const group_key = String(body.group_key || '').trim();
    if (!group_key) return fail(res, 400, '缺少 group_key');
    const name = String(body.name || '').trim();
    if (!name) return fail(res, 400, '请填写分类名称');
    const row = await Category.create({
      name,
      group_type: group_key,
      icon_url: body.icon_url != null && String(body.icon_url).trim() ? String(body.icon_url).trim() : null,
      sort_order: body.sort_order != null ? parseInt(body.sort_order, 10) || 0 : 0
    });
    return ok(res, row.toJSON());
  } catch (e) {
    console.error('admin createCategory', e);
    return fail(res, 500, '创建失败');
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, '无效 id');
    const row = await Category.findByPk(id);
    if (!row) return fail(res, 404, '不存在', 404);
    const body = req.body || {};
    if (body.name != null) {
      const name = String(body.name).trim();
      if (!name) return fail(res, 400, '名称不能为空');
      row.name = name;
    }
    if (body.icon_url !== undefined) {
      row.icon_url = body.icon_url != null && String(body.icon_url).trim() ? String(body.icon_url).trim() : null;
    }
    if (body.sort_order != null) row.sort_order = parseInt(body.sort_order, 10) || 0;
    if (body.group_type != null) {
      const gt = String(body.group_type).trim();
      if (gt) row.group_type = gt;
    }
    await row.save();
    return ok(res, row.toJSON());
  } catch (e) {
    console.error('admin updateCategory', e);
    return fail(res, 500, '更新失败');
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, '无效 id');
    const row = await Category.findByPk(id);
    if (!row) return fail(res, 404, '不存在', 404);
    const n = await Service.count({ where: { category_id: id } });
    if (n > 0) return fail(res, 400, '分类下仍有服务');
    await row.destroy();
    return ok(res, { ok: true });
  } catch (e) {
    console.error('admin deleteCategory', e);
    return fail(res, 500, '删除失败');
  }
};

exports.listServices = async (req, res) => {
  try {
    const gk = String(req.query.group_key || '').trim();
    if (!gk) return fail(res, 400, '缺少 group_key');
    const cats = await Category.findAll({
      where: { group_type: gk },
      attributes: ['id'],
      raw: true
    });
    const ids = cats.map((c) => c.id);
    if (ids.length === 0) return ok(res, []);
    const rows = await Service.findAll({
      where: { category_id: { [Op.in]: ids } },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'group_type'] }],
      order: [['id', 'DESC']]
    });
    return ok(res, rows.map((r) => r.toJSON()));
  } catch (e) {
    console.error('admin listServices', e);
    return fail(res, 500, '查询失败');
  }
};

exports.createService = async (req, res) => {
  try {
    const body = req.body || {};
    const category_id = parseId(body.category_id);
    if (!category_id) return fail(res, 400, '请选择分类 category_id');
    const cat = await Category.findByPk(category_id);
    if (!cat) return fail(res, 400, '分类不存在');
    const title = String(body.title || '').trim();
    if (!title) return fail(res, 400, '请填写服务标题');
    let price = body.price;
    if (price != null && typeof price !== 'number') price = parseFloat(String(price));
    if (!Number.isFinite(price)) return fail(res, 400, '请填写有效价格');
    const row = await Service.create({
      category_id,
      title,
      description: body.description != null ? String(body.description) : title,
      price,
      cover_image: body.cover_image != null && String(body.cover_image).trim() ? String(body.cover_image).trim() : null,
      sales_count: body.sales_count != null ? parseInt(body.sales_count, 10) || 0 : 0,
      is_published: body.is_published === undefined || body.is_published === 1 || body.is_published === true ? 1 : 0
    });
    const withCat = await Service.findByPk(row.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'group_type'] }]
    });
    return ok(res, withCat.toJSON());
  } catch (e) {
    console.error('admin createService', e);
    return fail(res, 500, '创建失败');
  }
};

exports.updateService = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, '无效 id');
    const row = await Service.findByPk(id);
    if (!row) return fail(res, 404, '不存在', 404);
    const body = req.body || {};
    if (body.category_id != null) {
      const cid = parseId(body.category_id);
      if (cid) {
        const cat = await Category.findByPk(cid);
        if (!cat) return fail(res, 400, '分类不存在');
        row.category_id = cid;
      }
    }
    if (body.title != null) {
      const title = String(body.title).trim();
      if (!title) return fail(res, 400, '标题不能为空');
      row.title = title;
    }
    if (body.description != null) row.description = String(body.description);
    if (body.price != null) {
      const p = typeof body.price === 'number' ? body.price : parseFloat(String(body.price));
      if (!Number.isFinite(p)) return fail(res, 400, '价格无效');
      row.price = p;
    }
    if (body.cover_image !== undefined) {
      row.cover_image = body.cover_image != null && String(body.cover_image).trim() ? String(body.cover_image).trim() : null;
    }
    if (body.sales_count != null) row.sales_count = parseInt(body.sales_count, 10) || 0;
    if (body.is_published !== undefined) row.is_published = body.is_published === 1 || body.is_published === true ? 1 : 0;
    await row.save();
    const withCat = await Service.findByPk(row.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'group_type'] }]
    });
    return ok(res, withCat.toJSON());
  } catch (e) {
    console.error('admin updateService', e);
    return fail(res, 500, '更新失败');
  }
};

exports.deleteService = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, '无效 id');
    const row = await Service.findByPk(id);
    if (!row) return fail(res, 404, '不存在', 404);
    row.is_published = 0;
    await row.save();
    return ok(res, { ok: true });
  } catch (e) {
    console.error('admin deleteService', e);
    return fail(res, 500, '操作失败');
  }
};
