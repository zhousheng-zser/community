/**
 * 直约技工头像：来自 素材/家政/首页素材/4 同步到 img/worker_avatars/（1.png…6.png）
 * 按技工 id 循环对应，保证首页列表与详情、分类页同 id 同头像。
 */
const { imgUrl } = require('./util.js');

const SLOT_COUNT = 6;

function workerAvatarUrl(workerId) {
  const id = Number(workerId);
  if (!Number.isFinite(id) || id < 1) {
    return imgUrl('https://jshsp1.eds-tech.cn/uploads/file-1773395942165-45947155.png');
  }
  const slot = ((id - 1) % SLOT_COUNT) + 1;
  return imgUrl(`/img/worker_avatars/${slot}.png`);
}

module.exports = {
  workerAvatarUrl,
  SLOT_COUNT
};
