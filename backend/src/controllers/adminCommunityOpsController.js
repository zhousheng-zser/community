const { CommunityFeaturedGood, MarketGood, BenefitAllianceConfig } = require('../models');

exports.listCommunityFeatured = async (req, res) => {
  try {
    const communityId = req.query.community_id != null ? parseInt(req.query.community_id, 10) : null;
    const where = {};
    if (communityId) where.community_id = communityId;
    const rows = await CommunityFeaturedGood.findAll({
      where,
      include: [{ model: MarketGood, as: 'marketGood', required: false }],
      order: [['community_id', 'ASC'], ['sort_order', 'ASC'], ['id', 'DESC']]
    });
    res.json({
      errno: 0,
      data: {
        list: rows.map((r) => {
          const j = r.get({ plain: true });
          const g = j.marketGood;
          return {
            id: j.id,
            community_id: j.community_id,
            market_good_id: j.market_good_id,
            sort_order: j.sort_order,
            status: j.status,
            goods: g
              ? { id: g.id, name: g.name, main_image: g.main_image, price: g.price }
              : null
          };
        })
      }
    });
  } catch (e) {
    console.error('listCommunityFeatured', e);
    res.status(500).json({ errno: 500, errmsg: '查询失败' });
  }
};

exports.createCommunityFeatured = async (req, res) => {
  try {
    const b = req.body || {};
    const community_id = parseInt(b.community_id, 10);
    const market_good_id = parseInt(b.market_good_id, 10);
    if (!community_id || !market_good_id) {
      return res.status(400).json({ errno: 400, errmsg: '请填写 community_id 与 market_good_id' });
    }
    const g = await MarketGood.findByPk(market_good_id);
    if (!g) return res.status(404).json({ errno: 404, errmsg: '商品不存在' });
    const row = await CommunityFeaturedGood.create({
      community_id,
      market_good_id,
      sort_order: b.sort_order != null ? parseInt(b.sort_order, 10) : 0,
      status: b.status != null ? b.status : 1
    });
    res.status(201).json({ errno: 0, data: row });
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ errno: 400, errmsg: '该小区已配置此商品' });
    }
    console.error('createCommunityFeatured', e);
    res.status(500).json({ errno: 500, errmsg: '创建失败' });
  }
};

exports.updateCommunityFeatured = async (req, res) => {
  try {
    const row = await CommunityFeaturedGood.findByPk(req.params.id);
    if (!row) return res.status(404).json({ errno: 404, errmsg: '不存在' });
    const b = req.body || {};
    if (b.sort_order !== undefined) row.sort_order = parseInt(b.sort_order, 10);
    if (b.status !== undefined) row.status = b.status;
    await row.save();
    res.json({ errno: 0, data: row });
  } catch (e) {
    console.error('updateCommunityFeatured', e);
    res.status(500).json({ errno: 500, errmsg: '更新失败' });
  }
};

exports.deleteCommunityFeatured = async (req, res) => {
  try {
    const row = await CommunityFeaturedGood.findByPk(req.params.id);
    if (!row) return res.status(404).json({ errno: 404, errmsg: '不存在' });
    await row.destroy();
    res.json({ errno: 0, message: '已删除' });
  } catch (e) {
    console.error('deleteCommunityFeatured', e);
    res.status(500).json({ errno: 500, errmsg: '删除失败' });
  }
};

exports.getBenefitAllianceConfig = async (req, res) => {
  try {
    const scene = req.query.scene || 'benefit_card';
    const rows = await BenefitAllianceConfig.findAll({ where: { scene } });
    res.json({ errno: 0, data: rows });
  } catch (e) {
    console.error('getBenefitAllianceConfig', e);
    res.status(500).json({ errno: 500, errmsg: '查询失败' });
  }
};

exports.upsertBenefitAllianceConfig = async (req, res) => {
  try {
    const b = req.body || {};
    const scene = b.scene || 'benefit_card';
    const platform = b.platform === 'pdd' ? 'pdd' : 'jd';
    let row = await BenefitAllianceConfig.findOne({ where: { scene, platform } });
    if (row) {
      row.hero_image_url = b.hero_image_url != null ? b.hero_image_url : row.hero_image_url;
      row.hero_title = b.hero_title != null ? b.hero_title : row.hero_title;
      row.hero_subtitle = b.hero_subtitle != null ? b.hero_subtitle : row.hero_subtitle;
      await row.save();
    } else {
      row = await BenefitAllianceConfig.create({
        scene,
        platform,
        hero_image_url: b.hero_image_url || '',
        hero_title: b.hero_title || '',
        hero_subtitle: b.hero_subtitle || ''
      });
    }
    res.json({ errno: 0, data: row });
  } catch (e) {
    console.error('upsertBenefitAllianceConfig', e);
    res.status(500).json({ errno: 500, errmsg: '保存失败' });
  }
};
