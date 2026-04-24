const { Op } = require('sequelize');
const {
  MarketGood,
  MarketShop,
  LgHomeZoneProduct,
  LgHomeDailyNewsProduct,
  LgHomeTopSalesProduct,
  LgHomePeriodicModule,
  LgHomePeriodicModuleProduct,
  LgHomeFeedModule,
  LgHomeFeedModuleProduct,
  LgHomeChannel,
  LgHomeChannelProduct,
  LgHomeChannelTab,
  LgHomeChannelTabProduct
} = require('../models');

const LIST_DEFINITIONS = [
  { key: 'hot_zone', name: '爆款专区', kind: 'zone', zone_id: 1 },
  { key: 'gift_zone_all', name: '礼物专区（全量）', kind: 'zone', zone_id: 2 },
  { key: 'gift_elder', name: '礼物专区 > 送长辈', kind: 'zone', zone_id: 2, gift_sub_code: '送长辈' },
  { key: 'gift_friend', name: '礼物专区 > 送朋友', kind: 'zone', zone_id: 2, gift_sub_code: '送朋友' },
  { key: 'gift_colleague', name: '礼物专区 > 送同事', kind: 'zone', zone_id: 2, gift_sub_code: '送同事' },
  { key: 'gift_partner', name: '礼物专区 > 送伴侣', kind: 'zone', zone_id: 2, gift_sub_code: '送伴侣' },
  { key: 'pick_zone_all', name: '本地商城甄选（全量）', kind: 'zone', zone_id: 3 },
  { key: 'pick_food', name: '商城甄选 > 食品生鲜', kind: 'zone', zone_id: 3, sidebar_category: '食品生鲜' },
  { key: 'pick_home', name: '商城甄选 > 家居百货', kind: 'zone', zone_id: 3, sidebar_category: '家居百货' },
  { key: 'pick_beauty', name: '商城甄选 > 美妆洗护', kind: 'zone', zone_id: 3, sidebar_category: '美妆洗护' },
  { key: 'pick_fashion', name: '商城甄选 > 服装箱包', kind: 'zone', zone_id: 3, sidebar_category: '服装箱包' },
  { key: 'pick_digital', name: '商城甄选 > 数码配件', kind: 'zone', zone_id: 3, sidebar_category: '数码配件' },
  { key: 'pick_mother', name: '商城甄选 > 母婴系列', kind: 'zone', zone_id: 3, sidebar_category: '母婴系列' },
  { key: 'pick_craft', name: '商城甄选 > 传统工艺', kind: 'zone', zone_id: 3, sidebar_category: '传统工艺' },
  { key: 'pick_other', name: '商城甄选 > 其他', kind: 'zone', zone_id: 3, sidebar_category: '其他' },
  { key: 'high_comm_zone', name: '高佣专区', kind: 'zone', zone_id: 4 },
  { key: 'brand_goods', name: '品牌好货', kind: 'channel', channel_key: 'brand_goods' },
  { key: 'jiuzhou_haowu', name: '寻找九州好物（多Tab）', kind: 'channel_tab', channel_key: 'jiuzhou_haowu' },
  { key: 'autumn_winter', name: '秋冬好物', kind: 'channel', channel_key: 'autumn_winter' },
  { key: 'daily_news', name: '每日上新（首页展示）', kind: 'daily_news', safe_edit: true },
  { key: 'top_sales', name: '热卖TOP榜（首页展示）', kind: 'top_sales', safe_edit: true },
  { key: 'periodic_today', name: '周期榜单 > 今日主推', kind: 'periodic_modules', module_name: '今日主推', safe_edit: true },
  { key: 'periodic_weekly', name: '周期榜单 > 本周甄选', kind: 'periodic_modules', module_name: '本周甄选', safe_edit: true },
  { key: 'feed_high_comm_first', name: 'Feed > 高佣推荐（首屏）', kind: 'feed_modules', module_name: '高佣推荐', safe_edit: true },
  { key: 'feed_hot_shop_first', name: 'Feed > 热门好店（首屏）', kind: 'feed_modules', module_name: '热门好店', safe_edit: true },
  { key: 'feed_you_like_first', name: 'Feed > 你可能喜欢（首屏）', kind: 'feed_modules', module_name: '你可能喜欢', safe_edit: true },
  { key: 'feed_high_comm_paged', name: 'Feed > 高佣推荐（翻页）', kind: 'feed_modules', module_name: '高佣推荐', safe_edit: true },
  { key: 'feed_hot_shop_paged', name: 'Feed > 热门好店（翻页）', kind: 'feed_modules', module_name: '热门好店', safe_edit: true },
  { key: 'feed_you_like_paged', name: 'Feed > 你可能喜欢（翻页）', kind: 'feed_modules', module_name: '你可能喜欢', safe_edit: true }
];

function getDef(key) {
  return LIST_DEFINITIONS.find((x) => x.key === key);
}

async function findGoodAndShop(goodsId) {
  const good = await MarketGood.findByPk(goodsId);
  if (!good) return null;
  const shop = await MarketShop.findByPk(good.shop_id);
  if (!shop) return null;
  return { good, shop };
}

async function resolveContext(def) {
  if (def.kind === 'channel' || def.kind === 'channel_tab') {
    const channel = await LgHomeChannel.findOne({ where: { channel_key: def.channel_key } });
    if (!channel) return { channel: null, tabs: [] };
    const tabs = def.kind === 'channel_tab'
      ? await LgHomeChannelTab.findAll({ where: { channel_id: channel.id }, order: [['sort', 'DESC'], ['id', 'ASC']] })
      : [];
    return { channel, tabs };
  }
  if (def.kind === 'periodic_modules') {
    const modules = await LgHomePeriodicModule.findAll({ where: { status: 1 }, order: [['sort', 'DESC'], ['id', 'ASC']] });
    return { modules };
  }
  if (def.kind === 'feed_modules') {
    const modules = await LgHomeFeedModule.findAll({ where: { status: 1 }, order: [['sort', 'DESC'], ['id', 'ASC']] });
    return { modules };
  }
  return {};
}

exports.listDefinitions = async (_req, res) => {
  res.json({ message: 'ok', data: LIST_DEFINITIONS });
};

exports.listItems = async (req, res) => {
  try {
    const def = getDef(req.query.list_key);
    if (!def) return res.status(400).json({ error: '无效 list_key' });
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;
    let rows = [];
    let count = 0;
    let meta = {};

    if (def.kind === 'zone') {
      const where = { zone_id: def.zone_id };
      if (def.gift_sub_code) where.gift_sub_code = def.gift_sub_code;
      if (def.sidebar_category) where.sidebar_category = def.sidebar_category;
      const rs = await LgHomeZoneProduct.findAndCountAll({ where, offset, limit, order: [['sort', 'DESC'], ['id', 'DESC']] });
      rows = rs.rows;
      count = rs.count;
    } else if (def.kind === 'channel') {
      const { channel } = await resolveContext(def);
      if (!channel) return res.json({ message: 'ok', total: 0, page, limit, data: [] });
      const rs = await LgHomeChannelProduct.findAndCountAll({
        where: { channel_id: channel.id },
        offset,
        limit,
        order: [['sort', 'DESC'], ['id', 'DESC']]
      });
      rows = rs.rows;
      count = rs.count;
    } else if (def.kind === 'channel_tab') {
      const { channel, tabs } = await resolveContext(def);
      if (!channel) return res.json({ message: 'ok', total: 0, page, limit, data: [] });
      const tabIds = tabs.map((t) => t.id);
      if (tabIds.length === 0) return res.json({ message: 'ok', total: 0, page, limit, data: [] });
      const where = { tab_id: { [Op.in]: tabIds } };
      if (req.query.tab_id) where.tab_id = Number(req.query.tab_id);
      const rs = await LgHomeChannelTabProduct.findAndCountAll({ where, offset, limit, order: [['sort', 'DESC'], ['id', 'DESC']] });
      const tabMap = new Map(tabs.map((t) => [t.id, t.tab_name]));
      rows = rs.rows.map((r) => ({ ...r.toJSON(), module_name: tabMap.get(r.tab_id) || '' }));
      count = rs.count;
      meta = { tabs: tabs.map((t) => ({ id: t.id, name: t.tab_name })) };
    } else if (def.kind === 'daily_news') {
      const rs = await LgHomeDailyNewsProduct.findAndCountAll({ offset, limit, order: [['sort', 'DESC'], ['id', 'DESC']] });
      rows = rs.rows;
      count = rs.count;
    } else if (def.kind === 'top_sales') {
      const rs = await LgHomeTopSalesProduct.findAndCountAll({ offset, limit, order: [['sort', 'DESC'], ['id', 'DESC']] });
      rows = rs.rows;
      count = rs.count;
    } else if (def.kind === 'periodic_modules') {
      const { modules } = await resolveContext(def);
      const selectedModules = def.module_name
        ? modules.filter((m) => m.module_name === def.module_name)
        : modules;
      const ids = selectedModules.map((m) => m.id);
      if (!ids.length) return res.json({ message: 'ok', total: 0, page, limit, data: [] });
      const where = { module_id: { [Op.in]: ids } };
      const rs = await LgHomePeriodicModuleProduct.findAndCountAll({ where, offset, limit, order: [['sort', 'DESC'], ['id', 'DESC']] });
      const map = new Map(modules.map((m) => [m.id, m.module_name]));
      rows = rs.rows.map((r) => ({ ...r.toJSON(), module_name: map.get(r.module_id) || '' }));
      count = rs.count;
      if (!def.module_name) {
        meta = { modules: modules.map((m) => ({ id: m.id, name: m.module_name })) };
      }
    } else if (def.kind === 'feed_modules') {
      const { modules } = await resolveContext(def);
      const selectedModules = def.module_name
        ? modules.filter((m) => m.module_name === def.module_name)
        : modules;
      const ids = selectedModules.map((m) => m.id);
      if (!ids.length) return res.json({ message: 'ok', total: 0, page, limit, data: [] });
      const where = { module_id: { [Op.in]: ids } };
      const rs = await LgHomeFeedModuleProduct.findAndCountAll({ where, offset, limit, order: [['sort', 'DESC'], ['id', 'DESC']] });
      const map = new Map(modules.map((m) => [m.id, m.module_name]));
      rows = rs.rows.map((r) => ({ ...r.toJSON(), module_name: map.get(r.module_id) || '' }));
      count = rs.count;
      if (!def.module_name) {
        meta = { modules: modules.map((m) => ({ id: m.id, name: m.module_name })) };
      }
    }

    const rawData = Array.isArray(rows) ? rows.map((r) => (typeof r.toJSON === 'function' ? r.toJSON() : r)) : [];
    const goodsIds = [...new Set(rawData.map((x) => Number(x.goods_id)).filter((x) => Number.isFinite(x) && x > 0))];
    const shopIds = [...new Set(rawData.map((x) => Number(x.shop_id)).filter((x) => Number.isFinite(x) && x > 0))];
    const [goodsRows, shopRows] = await Promise.all([
      goodsIds.length ? MarketGood.findAll({ where: { id: { [Op.in]: goodsIds } }, attributes: ['id', 'name'] }) : [],
      shopIds.length ? MarketShop.findAll({ where: { id: { [Op.in]: shopIds } }, attributes: ['id', 'name'] }) : []
    ]);
    const goodsMap = new Map(goodsRows.map((x) => [Number(x.id), x.name]));
    const shopMap = new Map(shopRows.map((x) => [Number(x.id), x.name]));
    const data = rawData.map((item) => ({
      ...item,
      goods_name: goodsMap.get(Number(item.goods_id)) || '',
      shop_name: shopMap.get(Number(item.shop_id)) || ''
    }));
    return res.json({ message: 'ok', total: count, page, limit, data, meta });
  } catch (e) {
    console.error('admin local-goods-home listItems:', e);
    return res.status(500).json({ error: '加载失败' });
  }
};

exports.createItem = async (req, res) => {
  try {
    const def = getDef(req.body.list_key);
    if (!def) return res.status(400).json({ error: '无效 list_key' });
    const goodsId = Number(req.body.goods_id);
    if (!goodsId) return res.status(400).json({ error: 'goods_id 必填' });
    const pair = await findGoodAndShop(goodsId);
    if (!pair) return res.status(400).json({ error: '商品不存在或店铺不存在' });
    const sort = Number.isFinite(Number(req.body.sort)) ? Number(req.body.sort) : 0;
    const status = Number(req.body.status) === 0 ? 0 : 1;

    let row = null;
    if (def.kind === 'zone') {
      row = await LgHomeZoneProduct.create({
        zone_id: def.zone_id,
        goods_id: pair.good.id,
        shop_id: pair.shop.id,
        gift_sub_code: def.gift_sub_code || null,
        sidebar_category: def.sidebar_category || null,
        sort,
        status
      });
    } else if (def.kind === 'channel') {
      const { channel } = await resolveContext(def);
      if (!channel) return res.status(400).json({ error: '频道不存在' });
      row = await LgHomeChannelProduct.create({
        channel_id: channel.id,
        goods_id: pair.good.id,
        shop_id: pair.shop.id,
        sort,
        status
      });
    } else if (def.kind === 'channel_tab') {
      const tabId = Number(req.body.tab_id);
      if (!tabId) return res.status(400).json({ error: 'tab_id 必填' });
      row = await LgHomeChannelTabProduct.create({
        tab_id: tabId,
        goods_id: pair.good.id,
        shop_id: pair.shop.id,
        sort,
        status
      });
    } else if (def.kind === 'daily_news') {
      row = await LgHomeDailyNewsProduct.create({
        goods_id: pair.good.id,
        shop_id: pair.shop.id,
        sort,
        status
      });
    } else if (def.kind === 'top_sales') {
      row = await LgHomeTopSalesProduct.create({
        goods_id: pair.good.id,
        shop_id: pair.shop.id,
        sort,
        status
      });
    } else if (def.kind === 'periodic_modules') {
      const { modules } = await resolveContext(def);
      const moduleId = def.module_name
        ? Number((modules.find((m) => m.module_name === def.module_name) || {}).id)
        : Number(req.body.module_id);
      if (!moduleId) return res.status(400).json({ error: 'module_id 必填' });
      row = await LgHomePeriodicModuleProduct.create({
        module_id: moduleId,
        goods_id: pair.good.id,
        shop_id: pair.shop.id,
        sort,
        status
      });
    } else if (def.kind === 'feed_modules') {
      const { modules } = await resolveContext(def);
      const moduleId = def.module_name
        ? Number((modules.find((m) => m.module_name === def.module_name) || {}).id)
        : Number(req.body.module_id);
      if (!moduleId) return res.status(400).json({ error: 'module_id 必填' });
      row = await LgHomeFeedModuleProduct.create({
        module_id: moduleId,
        goods_id: pair.good.id,
        shop_id: pair.shop.id,
        sort,
        status
      });
    } else {
      return res.status(400).json({ error: '不支持的列表类型' });
    }
    return res.status(201).json({ message: '创建成功', data: row });
  } catch (e) {
    console.error('admin local-goods-home createItem:', e);
    return res.status(500).json({ error: '创建失败' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const def = getDef(req.body.list_key);
    if (!def) return res.status(400).json({ error: '无效 list_key' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: '无效 id' });

    let row = null;
    if (def.kind === 'zone') row = await LgHomeZoneProduct.findByPk(id);
    else if (def.kind === 'channel') row = await LgHomeChannelProduct.findByPk(id);
    else if (def.kind === 'channel_tab') row = await LgHomeChannelTabProduct.findByPk(id);
    else if (def.kind === 'daily_news') row = await LgHomeDailyNewsProduct.findByPk(id);
    else if (def.kind === 'top_sales') row = await LgHomeTopSalesProduct.findByPk(id);
    else if (def.kind === 'periodic_modules') row = await LgHomePeriodicModuleProduct.findByPk(id);
    else if (def.kind === 'feed_modules') row = await LgHomeFeedModuleProduct.findByPk(id);
    if (!row) return res.status(404).json({ error: '记录不存在' });

    if (req.body.goods_id !== undefined) {
      const pair = await findGoodAndShop(Number(req.body.goods_id));
      if (!pair) return res.status(400).json({ error: '商品不存在或店铺不存在' });
      row.goods_id = pair.good.id;
      row.shop_id = pair.shop.id;
    }
    if (req.body.sort !== undefined) row.sort = Number(req.body.sort) || 0;
    if (req.body.status !== undefined) row.status = Number(req.body.status) === 0 ? 0 : 1;
    if (def.kind === 'channel_tab' && req.body.tab_id !== undefined) row.tab_id = Number(req.body.tab_id) || row.tab_id;
    if (def.kind === 'periodic_modules' && !def.module_name && req.body.module_id !== undefined) {
      row.module_id = Number(req.body.module_id) || row.module_id;
    }
    if (def.kind === 'feed_modules' && !def.module_name && req.body.module_id !== undefined) {
      row.module_id = Number(req.body.module_id) || row.module_id;
    }

    await row.save();
    return res.json({ message: '更新成功', data: row });
  } catch (e) {
    console.error('admin local-goods-home updateItem:', e);
    return res.status(500).json({ error: '更新失败' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const def = getDef(req.query.list_key);
    if (!def) return res.status(400).json({ error: '无效 list_key' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: '无效 id' });
    let row = null;
    if (def.kind === 'zone') row = await LgHomeZoneProduct.findByPk(id);
    else if (def.kind === 'channel') row = await LgHomeChannelProduct.findByPk(id);
    else if (def.kind === 'channel_tab') row = await LgHomeChannelTabProduct.findByPk(id);
    else if (def.kind === 'daily_news') row = await LgHomeDailyNewsProduct.findByPk(id);
    else if (def.kind === 'top_sales') row = await LgHomeTopSalesProduct.findByPk(id);
    else if (def.kind === 'periodic_modules') row = await LgHomePeriodicModuleProduct.findByPk(id);
    else if (def.kind === 'feed_modules') row = await LgHomeFeedModuleProduct.findByPk(id);
    if (!row) return res.status(404).json({ error: '记录不存在' });
    await row.destroy();
    return res.json({ message: '已删除' });
  } catch (e) {
    console.error('admin local-goods-home deleteItem:', e);
    return res.status(500).json({ error: '删除失败' });
  }
};

exports.searchGoods = async (req, res) => {
  try {
    const keyword = String(req.query.keyword || '').trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const where = {};
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { goods_no: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const goods = await MarketGood.findAll({
      where,
      attributes: ['id', 'name', 'goods_no', 'shop_id', 'status'],
      order: [['id', 'DESC']],
      limit
    });
    const shopIds = [...new Set(goods.map((g) => Number(g.shop_id)).filter((x) => Number.isFinite(x) && x > 0))];
    const shops = shopIds.length
      ? await MarketShop.findAll({ where: { id: { [Op.in]: shopIds } }, attributes: ['id', 'name'] })
      : [];
    const shopMap = new Map(shops.map((s) => [Number(s.id), s.name]));
    const data = goods.map((g) => ({
      id: g.id,
      name: g.name,
      goods_no: g.goods_no || '',
      shop_id: g.shop_id,
      shop_name: shopMap.get(Number(g.shop_id)) || '',
      status: g.status
    }));
    return res.json({ message: 'ok', data });
  } catch (e) {
    console.error('admin local-goods-home searchGoods:', e);
    return res.status(500).json({ error: '搜索商品失败' });
  }
};
