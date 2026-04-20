/**
 * 直约技工：接口行 → 展示模型（首页横滑、分类列表、详情共用头像与姓名字段规则）
 */
const { imgUrl } = require('./util.js');
const { workerAvatarUrl } = require('./workerAvatars.js');

function pickWorkerAvatar(w) {
  if (!w || typeof w !== 'object') {
    return workerAvatarUrl(0);
  }
  const av = w.avatar_url || w.avatar;
  return av ? imgUrl(av) : workerAvatarUrl(w.id);
}

/** 男/女展示（与后端 gender 枚举对齐） */
function genderToLabel(g) {
  if (g == null || g === '') return '';
  const s = String(g).trim().toLowerCase();
  if (['m', 'male', '1', '男'].includes(s)) return '男';
  if (['f', 'female', '2', '女'].includes(s)) return '女';
  if (s === '♂' || g === '♂') return '男';
  if (s === '♀' || g === '♀') return '女';
  return '';
}

/** 首页「直约技工」横滑卡片：头像、姓名、性别、简介摘要、主要方向、服务单数 */
function mapWorkerForHomeCard(w) {
  const cnt =
    w.service_count != null
      ? w.service_count
      : w.serviceCount != null
        ? w.serviceCount
        : w.order_count;
  const ordersText = cnt != null ? `服务${cnt}单` : w.orders || '服务0单';
  const rawDesc = w.desc || w.resume || w.introduction || w.bio || '';
  const intro =
    rawDesc.length > 40 ? String(rawDesc).slice(0, 40) + '…' : String(rawDesc || '');
  const mainDirection =
    w.main_direction ||
    w.specialty ||
    w.main_skill ||
    (Array.isArray(w.tags) && w.tags.length ? w.tags[0] : '') ||
    '到家服务';
  return {
    id: w.id,
    name: w.name || w.real_name || w.nickname || '技工',
    orders: ordersText,
    avatar: pickWorkerAvatar(w),
    genderLabel: genderToLabel(w.gender),
    intro,
    mainDirection: String(mainDirection).slice(0, 12)
  };
}

/** 分类页「全部技工」列表卡片 */
function mapWorkerForClassifyCard(w) {
  return {
    id: w.id,
    name: w.name || w.real_name || w.nickname || '技工',
    region: w.region || w.city || w.hometown || '',
    gender: w.gender || '',
    serviceCount: Number(w.serviceCount || w.service_count || w.orders || 0) || 0,
    exp: Number(w.exp || w.work_years || w.workExp || 0) || 0,
    desc: w.desc || w.resume || '',
    tags: Array.isArray(w.tags) ? w.tags : [],
    avatar: pickWorkerAvatar(w)
  };
}

module.exports = {
  pickWorkerAvatar,
  genderToLabel,
  mapWorkerForHomeCard,
  mapWorkerForClassifyCard
};
