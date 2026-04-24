const { PddBenefitGood } = require('../models');

exports.list = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const scene = req.query.scene || 'benefit_card';
    const offset = (page - 1) * pageSize;
    const { rows, count } = await PddBenefitGood.findAndCountAll({
      where: { scene },
      offset,
      limit: pageSize,
      order: [['sort_order', 'DESC'], ['id', 'DESC']]
    });
    res.json({ data: { list: rows, total: count } });
  } catch (e) {
    console.error('admin pdd benefit list:', e);
    res.status(500).json({ error: '获取失败' });
  }
};

exports.create = async (req, res) => {
  try {
    const b = req.body || {};
    const row = await PddBenefitGood.create({
      scene: b.scene || 'benefit_card',
      link_key: b.link_key || b.goods_id || '',
      title: b.title,
      image_url: b.image_url,
      spread_url: b.spread_url,
      mini_path: b.mini_path || null,
      price: b.price || null,
      coupon_price: b.coupon_price || null,
      sort_order: b.sort_order != null ? b.sort_order : 0,
      status: b.status != null ? b.status : 1
    });
    res.status(201).json({ message: '创建成功', data: row });
  } catch (e) {
    console.error('admin pdd benefit create:', e);
    res.status(500).json({ error: '创建失败' });
  }
};

exports.update = async (req, res) => {
  try {
    const row = await PddBenefitGood.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: '记录不存在' });
    const b = req.body || {};
    const fields = ['scene', 'title', 'image_url', 'spread_url', 'mini_path', 'price', 'coupon_price', 'sort_order', 'status', 'link_key'];
    fields.forEach((f) => {
      if (b[f] !== undefined) row[f] = b[f];
    });
    await row.save();
    res.json({ message: '更新成功', data: row });
  } catch (e) {
    console.error('admin pdd benefit update:', e);
    res.status(500).json({ error: '更新失败' });
  }
};

exports.destroy = async (req, res) => {
  try {
    const row = await PddBenefitGood.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: '记录不存在' });
    await row.destroy();
    res.json({ message: '已删除' });
  } catch (e) {
    console.error('admin pdd benefit delete:', e);
    res.status(500).json({ error: '删除失败' });
  }
};
