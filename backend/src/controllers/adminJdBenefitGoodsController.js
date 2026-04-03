const { JdBenefitGood } = require('../jd');

function dbErrMessage(e) {
  const msg = e && e.message ? String(e.message) : '';
  if (/doesn't exist|Unknown table|ER_NO_SUCH_TABLE|no such table/i.test(msg)) {
    return '缺少数据表 jd_benefit_goods：请执行 backend/sql/jd_benefit_goods.sql，或在 .env 设置 DB_SYNC_JD=1 后重启 backend';
  }
  return msg || '数据库错误';
}

function pickBody(body) {
  if (!body || typeof body !== 'object') return {};
  const scene = body.scene != null ? String(body.scene).trim() : 'benefit_card';
  const sku_id = body.sku_id != null ? String(body.sku_id).trim() : '';
  const title = body.title != null ? String(body.title).trim() : '';
  const image_url = body.image_url != null ? String(body.image_url).trim() : '';
  const spread_url = body.spread_url != null ? String(body.spread_url).trim() : '';
  const price = body.price === '' || body.price == null ? null : Number(body.price);
  const rebate_amount =
    body.rebate_amount === '' || body.rebate_amount == null ? null : Number(body.rebate_amount);
  const sort_order =
    body.sort_order === '' || body.sort_order == null ? 0 : parseInt(body.sort_order, 10) || 0;
  const status =
    body.status === '' || body.status == null ? 1 : parseInt(body.status, 10) ? 1 : 0;
  return {
    scene: scene || 'benefit_card',
    sku_id,
    title,
    image_url,
    spread_url,
    price: Number.isFinite(price) ? price : null,
    rebate_amount: Number.isFinite(rebate_amount) ? rebate_amount : null,
    sort_order,
    status
  };
}

async function list(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const scene = (req.query.scene || 'benefit_card').trim();
    const offset = (page - 1) * pageSize;
    const { rows, count } = await JdBenefitGood.findAndCountAll({
      where: { scene },
      order: [
        ['sort_order', 'ASC'],
        ['id', 'ASC']
      ],
      limit: pageSize,
      offset
    });
    const list = rows.map((r) => ({
      id: r.id,
      scene: r.scene,
      sku_id: r.sku_id,
      title: r.title,
      image_url: r.image_url,
      spread_url: r.spread_url,
      price: r.price != null ? String(r.price) : '',
      rebate_amount: r.rebate_amount != null ? String(r.rebate_amount) : '',
      sort_order: r.sort_order,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
    return res.json({
      code: 200,
      data: { list, total: count, page, pageSize }
    });
  } catch (e) {
    console.error('[admin/jd-benefit-goods list]', e);
    return res.status(500).json({ code: 500, message: dbErrMessage(e) });
  }
}

async function create(req, res) {
  try {
    const row = pickBody(req.body);
    if (!row.sku_id) return res.status(400).json({ code: 400, message: 'sku_id 必填' });
    if (!row.title) return res.status(400).json({ code: 400, message: '标题必填' });
    if (!row.image_url) return res.status(400).json({ code: 400, message: '主图 URL 必填' });
    if (!row.spread_url) return res.status(400).json({ code: 400, message: '推广链接必填' });
    const created = await JdBenefitGood.create(row);
    return res.status(201).json({
      code: 200,
      message: 'created',
      data: { id: created.id }
    });
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ code: 400, message: '该场景下 SKU 已存在' });
    }
    console.error('[admin/jd-benefit-goods create]', e);
    return res.status(500).json({ code: 500, message: dbErrMessage(e) });
  }
}

async function update(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ code: 400, message: '无效 id' });
    const row = await JdBenefitGood.findByPk(id);
    if (!row) return res.status(404).json({ code: 404, message: '记录不存在' });
    const next = pickBody({ ...row.toJSON(), ...req.body });
    if (!next.sku_id) return res.status(400).json({ code: 400, message: 'sku_id 必填' });
    if (!next.title) return res.status(400).json({ code: 400, message: '标题必填' });
    if (!next.image_url) return res.status(400).json({ code: 400, message: '主图 URL 必填' });
    if (!next.spread_url) return res.status(400).json({ code: 400, message: '推广链接必填' });
    if (next.sku_id !== row.sku_id || next.scene !== row.scene) {
      const clash = await JdBenefitGood.findOne({
        where: { scene: next.scene, sku_id: next.sku_id }
      });
      if (clash && clash.id !== row.id) {
        return res.status(400).json({ code: 400, message: '该场景下 SKU 已被其他记录占用' });
      }
    }
    await row.update(next);
    return res.json({ code: 200, message: 'ok' });
  } catch (e) {
    console.error('[admin/jd-benefit-goods update]', e);
    return res.status(500).json({ code: 500, message: dbErrMessage(e) });
  }
}

async function destroy(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ code: 400, message: '无效 id' });
    const row = await JdBenefitGood.findByPk(id);
    if (!row) return res.status(404).json({ code: 404, message: '记录不存在' });
    await row.destroy();
    return res.json({ code: 200, message: 'ok' });
  } catch (e) {
    console.error('[admin/jd-benefit-goods delete]', e);
    return res.status(500).json({ code: 500, message: dbErrMessage(e) });
  }
}

module.exports = {
  list,
  create,
  update,
  destroy
};
