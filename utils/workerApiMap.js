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

/** 首页「直约技工」横滑卡片 */
function mapWorkerForHomeCard(w) {
  const cnt =
    w.service_count != null
      ? w.service_count
      : w.serviceCount != null
        ? w.serviceCount
        : w.order_count;
  const ordersText = cnt != null ? `服务${cnt}单` : w.orders || '服务0单';
  return {
    id: w.id,
    name: w.name || w.real_name || w.nickname || '技工',
    orders: ordersText,
    avatar: pickWorkerAvatar(w)
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
  mapWorkerForHomeCard,
  mapWorkerForClassifyCard
};
