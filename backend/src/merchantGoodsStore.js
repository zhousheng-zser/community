/**
 * 商家端集市商品：内存演示（库存、安全库存、上下架），与小程序 package-merchant 字段对齐。
 */
function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

const initialGoods = () => [
  {
    id: 70001,
    shop_id: 1,
    title: '有机蔬菜礼盒 3kg',
    description: '时令有机蔬菜组合，适合家庭 2–3 人。',
    main_image: '',
    price: 68.0,
    stock: 48,
    inventory: 48,
    sales_count: 126,
    safe_stock: 10,
    low_stock_threshold: 10,
    is_published: 1
  },
  {
    id: 70002,
    shop_id: 1,
    title: '五常大米 5kg',
    description: '东北五常产区，真空包装。',
    main_image: '',
    price: 52.9,
    stock: 6,
    sales_count: 89,
    safe_stock: 8,
    is_published: 1
  },
  {
    id: 70003,
    shop_id: 1,
    title: '洗衣液 2L×2',
    description: '温和配方，机洗手洗均可。',
    main_image: '',
    price: 39.0,
    stock: 0,
    sales_count: 210,
    safe_stock: 5,
    is_published: 0
  },
  {
    id: 70004,
    shop_id: 1,
    title: '鲜牛奶 1L',
    description: '冷链配送，建议收货后冷藏。',
    main_image: '',
    price: 18.5,
    stock: 32,
    sales_count: 55,
    safe_stock: 12,
    is_published: 1
  }
];

let goods = initialGoods();

function listGoods() {
  return clone(goods);
}

function findGoods(id) {
  const n = Number(id);
  return goods.find((g) => Number(g.id) === n) || null;
}

/** 返回副本，供 GET 详情 */
function getGoods(id) {
  const g = findGoods(id);
  return g ? clone(g) : null;
}

function restock(id, addQty) {
  const n = Number(id);
  const idx = goods.findIndex((g) => Number(g.id) === n);
  if (idx < 0) return null;
  const cur = goods[idx].stock != null ? goods[idx].stock : goods[idx].inventory || 0;
  const next = Number(cur) + addQty;
  goods[idx] = { ...goods[idx], stock: next, inventory: next };
  return clone(goods[idx]);
}

function setShelf(id, published) {
  const n = Number(id);
  const idx = goods.findIndex((g) => Number(g.id) === n);
  if (idx < 0) return null;
  goods[idx] = {
    ...goods[idx],
    is_published: published ? 1 : 0,
    published,
    on_shelf: published
  };
  return clone(goods[idx]);
}

function updateGoods(id, patch) {
  const n = Number(id);
  const idx = goods.findIndex((g) => Number(g.id) === n);
  if (idx < 0) return null;
  goods[idx] = { ...goods[idx], ...patch };
  return clone(goods[idx]);
}

function resetForTests() {
  goods = initialGoods();
}

module.exports = {
  listGoods,
  findGoods,
  getGoods,
  restock,
  setShelf,
  updateGoods,
  resetForTests
};
