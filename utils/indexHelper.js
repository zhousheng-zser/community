/**
 * 首页辅助函数（从 pages/index/index.js 提取的纯函数）
 * 减少 index.js 体积，提高可复用性
 */

const util = require('./util.js');
const { imgUrl, pickMarketShopAvatarPath, normalizeShopProductRow, extractDistanceKmFromProduct, filterShopProductsByDistance, buildShopGoodsQuery, unwrapList } = util;

const CATEGORY_MAP = {
  '食品生鲜': 'AAAA',
  '美妆洗护': 'AAAB',
  '居家百货': 'AAAC',
  '服装箱包': 'AAAD',
  '母婴系列': 'AAAE',
  '家用电器': 'AAAF',
  '数码产品': 'AAAG',
  '珠宝饰品': 'AAAH',
  '旅游出行': 'AAAI',
  '传统工艺': 'AAAJ'
};

/**
 * 规范化集市店铺数据（用于首页店铺卡片展示）
 */
const normalizeMarketShop = (item) => {
  const goodsRaw = Array.isArray(item.goods)
    ? item.goods
    : (Array.isArray(item.preview_goods) ? item.preview_goods : []);
  const goods = goodsRaw.slice(0, 8).map((g, idx) => ({
    id: g.id || g.goods_id || (idx + 1),
    name: g.name || g.goods_name || '精选商品',
    price: String(g.price || g.goods_price || '0'),
    image: g.main_image || g.image ? imgUrl(g.main_image || g.image) : ''
  }));
  const soldCount = Number(item.sold_count || 0);
  const deliveryText = item.delivery_desc
    || (item.min_order_amount != null
      ? `起送￥${item.min_order_amount}  配送费￥${item.delivery_fee || 0}`
      : '起送￥0  免配送费');
  let distanceLabel = '';
  if (item.distance_km != null && item.distance_km !== '') {
    const d = Number(item.distance_km);
    if (!Number.isNaN(d)) distanceLabel = `距您${d.toFixed(1)}km`;
  }
  const coverPath = pickMarketShopAvatarPath(item);
  return {
    id: item.id,
    cat: CATEGORY_MAP[item.category] || item.category || 'AAAA',
    name: item.name || item.shop_name || '社区店铺',
    badge: item.delivery_type_text || item.delivery_type || '商家自送',
    delivery: deliveryText,
    sold: `已售${soldCount}`,
    distanceLabel,
    coverUrl: coverPath ? imgUrl(coverPath) : '',
    ratingText: item.rating != null && item.rating !== '' ? `评分 ${item.rating}` : '',
    goods
  };
};

/**
 * 从模块对象中提取商品列表（兼容多种字段名）
 */
const pickModuleGoodsList = (module) => {
  if (!module || typeof module !== 'object') return [];
  const candidates = [
    module.goods_list,
    module.goodsList,
    module.goods,
    module.products,
    module.product_list,
    module.productList,
    module.items,
    module.list,
    module.rows,
    module.records,
    module.result,
    module.data && module.data.goods_list,
    module.data && module.data.goodsList,
    module.data && module.data.goods,
    module.data && module.data.products,
    module.data && module.data.product_list,
    module.data && module.data.productList,
    module.data && module.data.items,
    module.data && module.data.list,
    module.data && module.data.rows,
    module.data && module.data.records,
    module.data && module.data.result
  ];
  for (let i = 0; i < candidates.length; i++) {
    if (Array.isArray(candidates[i])) return candidates[i];
  }
  return [];
};

/**
 * 规范化模块分组数据
 */
const normalizeModuleGroups = (groups) => {
  if (Array.isArray(groups)) return groups;
  if (!groups || typeof groups !== 'object') return [];
  return Object.keys(groups).map((key) => {
    const value = groups[key];
    if (Array.isArray(value)) {
      return { module_name: key, goods_list: value };
    }
    if (value && typeof value === 'object') {
      return {
        module_name: value.module_name || value.name || value.title || key,
        ...value
      };
    }
    return { module_name: key, goods_list: [] };
  });
};

/**
 * 解包本地商品接口响应（处理多层 data 嵌套）
 */
const unwrapLocalGoodsPayload = (res) => {
  let payload = res && typeof res === 'object' ? res : {};
  if (payload.data && typeof payload.data === 'object') payload = payload.data;
  if (payload.data && typeof payload.data === 'object') payload = payload.data;
  return payload;
};

/**
 * 规范化模块商品项
 */
const normalizeModuleGoods = (item, i, extra = {}) => {
  const row = normalizeShopProductRow(item, i);
  const id = item.id || item.goods_id || `${extra.module || 'mod'}_${i}`;
  const rankRaw = item.rank != null ? item.rank : (i + 1);
  return {
    ...row,
    id,
    title: row.name,
    rank: String(rankRaw).padStart(2, '0'),
    distance_km: extractDistanceKmFromProduct(item)
  };
};

/**
 * 规范化模块商品列表
 */
const normalizeModuleList = (list, extra = {}) => {
  const arr = Array.isArray(list) ? list : pickModuleGoodsList(list);
  return filterShopProductsByDistance(arr, 10).map((item, idx) => normalizeModuleGoods(item, idx, extra));
};

/**
 * 构建本地商品查询参数
 */
const buildLocalGoodsQuery = (extra = {}) => {
  return buildShopGoodsQuery({ distance_km: 10, ...extra });
};

/**
 * 从横幅/导航项构建跳转 URL
 */
const buildBannerUrl = (item) => {
  const t = (item.linkType || 'none').toLowerCase();
  const val = item.linkValue != null ? String(item.linkValue).trim() : '';
  if (t === 'none' || !val) return null;
  if (t === 'service') return `/pages/service/service?id=${encodeURIComponent(val)}`;
  if (t === 'page') return val.startsWith('/') ? val : `/${val}`;
  if (t === 'h5') return { type: 'h5', value: val };
  return null;
};

module.exports = {
  normalizeMarketShop,
  pickModuleGoodsList,
  normalizeModuleGroups,
  unwrapLocalGoodsPayload,
  normalizeModuleGoods,
  normalizeModuleList,
  buildLocalGoodsQuery,
  buildBannerUrl
};
