/**
 * 具体服务列表/详情图：按服务标题匹配 img/service_home3/ 下文件名（由 首页素材/3 + /1 同步）
 * 例：标题「衣橱整理收纳」→ 素材文件 衣橱收纳.png（见 TITLE_TO_BASENAME）
 */
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
  return home3PathForTitle(title) || fallback;
}

module.exports = {
  filenameForServiceTitle,
  home3PathForTitle,
  listImageFromHome3
};
