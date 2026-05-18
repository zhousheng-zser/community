/**
 * 具体服务列表/详情图：按服务标题匹配 img/service_home3/ 下文件名（由 首页素材/3 + /1 同步）
 * 例：标题「衣橱整理收纳」→ 素材文件 衣橱收纳.png（见 TITLE_TO_BASENAME）
 */
const { imgUrl } = require('./util.js');
const FILENAMES = require('./serviceHome3Filenames.js');

const SET = new Set(FILENAMES);

/**
 * 文案里的服务名与素材文件名不一致时的别名（不含 .png）
 * 如：衣橱整理收纳【2小时】→ 衣橱收纳.png
 */
const TITLE_TO_BASENAME = {
  衣橱整理收纳: '衣橱收纳',
  校区接送小孩: '接送小孩',
  课后陪读辅导: '课后辅导',
  零星打胶与家修杂事: '零星打胶'
};

function baseNameFromTitle(title) {
  return String(title || '')
    .replace(/【[^】]+】/g, '')
    .replace(/（[^）]+）/g, '')
    .trim();
}

function filenameForServiceTitle(title) {
  let core = baseNameFromTitle(title);
  if (TITLE_TO_BASENAME[core]) core = TITLE_TO_BASENAME[core];
  else core = core.replace(/\//g, '_');
  return `${core}.png`;
}

/**
 * @param {string} title 含【时长】或（时长）的完整标题
 * @returns {string|null} 本地路径，无对应文件时 null
 */
function home3PathForTitle(title) {
  const fn = filenameForServiceTitle(title);
  return SET.has(fn) ? `/img/service_home3/${fn}` : null;
}

/**
 * 分类页服务卡片
 * @param {string} title
 * @param {string} fallback 无本地图时的 Unsplash 等地址
 */
function listImageFromHome3(title, fallback) {
  const raw = home3PathForTitle(title) || fallback;
  return imgUrl(raw);
}

function pickLocalServiceImage(title, localConfig) {
  if (!localConfig || !Array.isArray(localConfig.services)) return null;
  const t = String(title || '').trim();
  const hit = localConfig.services.find((s) => s && String(s.title).trim() === t);
  return hit && hit.image ? hit.image : null;
}

/** 是否为本项目可稳定加载的图片地址（uploads / 包内 / 已配置域名） */
function isReliableServiceImageUrl(url) {
  const u = String(url || '').trim();
  if (!u || /^data:image\/gif/i.test(u)) return false;
  if (u.startsWith('/img/')) return true;
  if (/\/uploads\//i.test(u)) return true;
  if (/eds-tech\.cn/i.test(u)) return true;
  return false;
}

/**
 * 分类页服务卡片图：优先 service_home3（同步素材），其次本地兜底配置，再才用中台 cover（仅 uploads）
 * 避免中台 seed 的 unsplash 外链在真机合法域名下无法显示导致「图标掉了」
 */
function resolveServiceListImage(title, remoteCoverUrl, localConfig) {
  const t = String(title || '').trim();
  const home3 = home3PathForTitle(t);
  if (home3) return imgUrl(home3);

  const fromLocal = pickLocalServiceImage(t, localConfig);
  if (fromLocal && isReliableServiceImageUrl(fromLocal)) return fromLocal;

  const remote = remoteCoverUrl != null ? String(remoteCoverUrl).trim() : '';
  if (remote) {
    const u = imgUrl(remote);
    if (isReliableServiceImageUrl(u)) return u;
  }

  if (fromLocal) return fromLocal;
  if (remote) return imgUrl(remote);
  return '';
}

module.exports = {
  filenameForServiceTitle,
  home3PathForTitle,
  listImageFromHome3,
  pickLocalServiceImage,
  resolveServiceListImage
};
