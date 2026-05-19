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
  零星打胶与家修杂事: '零星打胶',
  零星打胶和家修杂事: '零星打胶',
  家用油烟机深度清洗: '油烟机拆洗',
  滚筒洗衣机拆洗消毒: '洗衣机桶内清洗',
  冰箱除味杀菌清洗: '冰箱除菌清洗',
  挂式空调蒸汽清洗: '空调深度清洗',
  新房首次开荒保洁: '新房开荒保洁',
  全屋玻璃内外清洁: '全屋深度开荒',
  实木地板打蜡养护: '地板打蜡养护',
  床垫深度除螨杀菌: '全床深度除螨',
  布艺沙发除螨清洗: '布艺_皮质沙发清洗',
  三房一厅全屋除螨套餐: '居室除螨净化',
  实木地板清洁打蜡: '地板打蜡养护',
  真皮沙发上油保养: '布艺_皮质沙发清洗',
  实木餐桌椅养护打蜡: '地板打蜡养护',
  产后月嫂陪护体验: '专业育儿嫂上门',
  育儿家庭保洁助理: '儿童起居照顾',
  婴儿房收纳与安全整理: '儿童起居照顾',
  厨卫防水查漏修补: '厨卫漏水防水修缮',
  墙面开裂修补粉刷: '墙面修补刷新',
  入户门合页更换调试: '柜门铰链滑轨维修'
};

function baseNameFromTitle(title) {
  return String(title || '')
    .replace(/【[^】]+】/g, '')
    .replace(/（[^）]+）/g, '')
    .replace(/·[^·]*$/, '')
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
