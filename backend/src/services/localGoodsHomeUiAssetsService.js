const { LgHomeUiAsset } = require('../models');
const {
  LOCAL_GOODS_HOME_UI_ASSET_DEFAULTS,
  normalizeImageUrl
} = require('../constants/localGoodsHomeUiAssets');

async function ensureDefaults() {
  for (const row of LOCAL_GOODS_HOME_UI_ASSET_DEFAULTS) {
    const [record] = await LgHomeUiAsset.findOrCreate({
      where: { asset_key: row.asset_key },
      defaults: {
        label: row.label,
        group_type: row.group_type,
        image_url: row.image_url,
        sort_order: row.sort_order
      }
    });
    if (!record.label) {
      record.label = row.label;
      record.group_type = row.group_type;
      record.sort_order = row.sort_order;
      await record.save();
    }
  }
}

async function listAssets() {
  await ensureDefaults();
  const rows = await LgHomeUiAsset.findAll({
    order: [['sort_order', 'ASC'], ['id', 'ASC']]
  });
  return rows.map((r) => ({
    asset_key: r.asset_key,
    label: r.label,
    group_type: r.group_type,
    image_url: r.image_url,
    sort_order: r.sort_order
  }));
}

async function getAssetsMap() {
  const list = await listAssets();
  const map = {};
  list.forEach((item) => {
    map[item.asset_key] = item.image_url;
  });
  return map;
}

async function updateAssets(updates) {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new Error('assets 不能为空');
  }
  await ensureDefaults();
  const results = [];
  for (const item of updates) {
    const assetKey = String(item.asset_key || '').trim();
    if (!assetKey) continue;
    const row = await LgHomeUiAsset.findOne({ where: { asset_key: assetKey } });
    if (!row) continue;
    if (item.image_url !== undefined) {
      row.image_url = normalizeImageUrl(item.image_url);
    }
    await row.save();
    results.push({
      asset_key: row.asset_key,
      label: row.label,
      group_type: row.group_type,
      image_url: row.image_url,
      sort_order: row.sort_order
    });
  }
  return results;
}

module.exports = {
  ensureDefaults,
  listAssets,
  getAssetsMap,
  updateAssets,
  normalizeImageUrl
};
