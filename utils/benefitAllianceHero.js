/**
 * 惠民卡各联盟栏目头图与文案（统一品牌渐变图，非截图）
 */
const images = require('./images.js');

const THEMES = {
  jd: {
    key: 'jd',
    bannerKey: 'benefitJdAllianceHero',
    title: '惠民卡 · 京东联盟',
    sub: '领券购物 · 分享返佣',
    maskClass: 'benefit-hero-mask--jd'
  },
  pdd: {
    key: 'pdd',
    bannerKey: 'benefitPddAllianceHero',
    title: '惠民卡 · 拼多多',
    sub: '多多进宝 · 券后价更省',
    maskClass: 'benefit-hero-mask--pdd'
  },
  meituan: {
    key: 'meituan',
    bannerKey: 'benefitMtAllianceHero',
    title: '惠民卡 · 美团联盟',
    sub: '外卖红包 · 到店优惠 · 团购返利',
    maskClass: 'benefit-hero-mask--mt'
  },
  taobao: {
    key: 'taobao',
    bannerKey: 'benefitTbAllianceHero',
    title: '惠民卡 · 淘宝联盟',
    sub: '淘口令 · 优惠券 · 返利推广',
    maskClass: 'benefit-hero-mask--tb'
  },
  shangou: {
    key: 'shangou',
    bannerKey: 'benefitSgAllianceHero',
    title: '惠民卡 · 闪购专区',
    sub: '饿了么红包 · 淘宝闪购 · 爆品低价',
    maskClass: 'benefit-hero-mask--sg'
  },
  shequn: {
    key: 'shequn',
    bannerKey: 'benefitSqAllianceHero',
    title: '惠民卡 · 社群福利',
    sub: '社群专享 · 限时好价',
    maskClass: 'benefit-hero-mask--sq'
  },
  tuixiao: {
    key: 'tuixiao',
    bannerKey: 'benefitTxAllianceHero',
    title: '惠民卡 · 精选推销',
    sub: '精选活动 · 一键复制推广',
    maskClass: 'benefit-hero-mask--tx'
  },
  kfc: {
    key: 'kfc',
    bannerKey: 'benefitChainKfcHero',
    title: '惠民卡 · 肯德基',
    sub: '炸鸡汉堡 · 在线点餐',
    maskClass: 'benefit-hero-mask--kfc'
  },
  xbk: {
    key: 'xbk',
    bannerKey: 'benefitChainXbkHero',
    title: '惠民卡 · 星巴克',
    sub: '咖啡星享 · 在线点单',
    maskClass: 'benefit-hero-mask--xbk'
  },
  bgy: {
    key: 'bgy',
    bannerKey: 'benefitChainBgyHero',
    title: '惠民卡 · 百果园',
    sub: '新鲜水果 · 外送到家',
    maskClass: 'benefit-hero-mask--bgy'
  }
};

function getThemeBannerPath(themeKey, imgUrlFn) {
  const t = THEMES[themeKey];
  if (!t || !imgUrlFn) return '';
  const raw = images[t.bannerKey];
  return raw ? imgUrlFn(raw) : '';
}

function pickHeroFromApi(themeKey, apiBlock, imgUrlFn) {
  const t = THEMES[themeKey] || {};
  // 头图固定用联盟品牌图，不用商品主图（display 接口首条 image 多为 SKU 图）
  const banner = getThemeBannerPath(themeKey, imgUrlFn);
  return {
    banner: banner || getThemeBannerPath(themeKey, imgUrlFn),
    title: (apiBlock && apiBlock.title) || t.title || '',
    subtitle: (apiBlock && apiBlock.subtitle) || t.sub || '',
    maskClass: t.maskClass || 'benefit-hero-mask--light',
    heroClass: `benefit-hero--${themeKey}`
  };
}

module.exports = {
  THEMES,
  getThemeBannerPath,
  pickHeroFromApi
};
