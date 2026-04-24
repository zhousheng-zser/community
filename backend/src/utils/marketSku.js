'use strict';

const { MarketGoodSku, MarketGood, sequelize } = require('../models');

function parseSpecs(specs) {
  if (specs == null) return [];
  if (Array.isArray(specs)) return specs.map((x) => String(x));
  if (typeof specs === 'string') {
    try {
      const j = JSON.parse(specs);
      return Array.isArray(j) ? j.map((x) => String(x)) : [];
    } catch (_e) {
      return [];
    }
  }
  return [];
}

function buildSkuTreeFromRows(skuRows) {
  const skus = skuRows.map((s) => {
    const j = s.get ? s.get({ plain: true }) : s;
    return {
      id: j.id,
      specs: parseSpecs(j.specs),
      price: j.price,
      stock: j.stock,
      image: j.image || ''
    };
  });
  if (skus.length === 0) return { sku_tree: [], sku_list: [] };
  const maxDim = skus.reduce((m, s) => Math.max(m, s.specs.length), 0);
  const groupLabels = ['规格', '口味', '套餐', '加料', '其它'];
  const sku_tree = [];
  for (let d = 0; d < maxDim; d++) {
    const group = groupLabels[d] || `规格${d + 1}`;
    const items = [...new Set(skus.map((s) => s.specs[d]).filter((v) => v != null && v !== ''))];
    if (items.length) sku_tree.push({ group, items });
  }
  const sku_list = skus.map((s) => ({
    id: `sku_${s.id}`,
    specs: s.specs,
    price: String(Number(s.price).toFixed(2)),
    stock: s.stock,
    image: s.image || ''
  }));
  return { sku_tree, sku_list };
}

function resolveSkuId(sku_id) {
  if (sku_id == null || sku_id === '') return null;
  const s = String(sku_id).replace(/^sku_/i, '');
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

async function syncGoodStockFromSkus(goodsId, transaction) {
  const rows = await MarketGoodSku.findAll({
    attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('stock')), 0), 'total']],
    where: { goods_id: goodsId, status: 'active' },
    raw: true,
    transaction
  });
  const total = rows[0] && rows[0].total != null ? Number(rows[0].total) : 0;
  await MarketGood.update({ stock: Math.max(0, Math.floor(total)) }, { where: { id: goodsId }, transaction });
}

async function refreshPriceRangeForGood(goodsId, transaction) {
  const row = await MarketGoodSku.findOne({
    attributes: [
      [sequelize.fn('MIN', sequelize.col('price')), 'min_p'],
      [sequelize.fn('MAX', sequelize.col('price')), 'max_p']
    ],
    where: { goods_id: goodsId, status: 'active' },
    raw: true,
    transaction
  });
  if (!row || row.min_p == null) return;
  const a = Number(row.min_p).toFixed(2);
  const b = Number(row.max_p).toFixed(2);
  const range = a === b ? a : `${a}-${b}`;
  await MarketGood.update({ price_range: range }, { where: { id: goodsId }, transaction });
}

module.exports = {
  parseSpecs,
  buildSkuTreeFromRows,
  resolveSkuId,
  syncGoodStockFromSkus,
  refreshPriceRangeForGood
};
