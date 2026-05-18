/** 本地商城首页运营图默认配置（与小程序 images.* 变量名一致） */
const LOCAL_GOODS_HOME_UI_ASSET_DEFAULTS = [
  {
    asset_key: 'bannerHome',
    label: '轮播海报 · 品牌好物',
    group_type: 'banner',
    sort_order: 1,
    image_url: '/uploads/file-1773395942165-45947155.png'
  },
  {
    asset_key: 'bannerSale',
    label: '轮播海报 · 秋冬好物',
    group_type: 'banner',
    sort_order: 2,
    image_url: '/uploads/file-1773395942500-585304598.png'
  },
  {
    asset_key: 'pushCateFire',
    label: '金刚区 · 爆款专区',
    group_type: 'category_icon',
    sort_order: 3,
    image_url: '/uploads/img/local_goods_icons/fire.png'
  },
  {
    asset_key: 'pushCateGift',
    label: '金刚区 · 礼物专区',
    group_type: 'category_icon',
    sort_order: 4,
    image_url: '/uploads/img/local_goods_icons/gift.png'
  },
  {
    asset_key: 'pushCateStar',
    label: '金刚区 · 本地商城甄选',
    group_type: 'category_icon',
    sort_order: 5,
    image_url: '/uploads/img/local_goods_icons/star.png'
  },
  {
    asset_key: 'pushCateMoney',
    label: '金刚区 · 高佣专区',
    group_type: 'category_icon',
    sort_order: 6,
    image_url: '/uploads/img/local_goods_icons/money.png'
  },
  {
    asset_key: 'goodsSkincare1',
    label: '导购卡片 · 品牌好货',
    group_type: 'guide_card',
    sort_order: 7,
    image_url: '/uploads/file-1773325942165-459472452.jpg'
  },
  {
    asset_key: 'pushFashion1',
    label: '导购卡片 · 秋冬好物',
    group_type: 'guide_card',
    sort_order: 8,
    image_url: '/uploads/file-17733293942125-459452655.jpg'
  }
];

function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const s = url.trim();
  if (!s) return '';
  if (s.startsWith('/uploads/')) return s;
  if (/^https?:\/\//i.test(s)) {
    try {
      return new URL(s).pathname;
    } catch {
      return s;
    }
  }
  return s.startsWith('/') ? s : `/uploads/${s.replace(/^\/+/, '')}`;
}

module.exports = {
  LOCAL_GOODS_HOME_UI_ASSET_DEFAULTS,
  normalizeImageUrl
};
