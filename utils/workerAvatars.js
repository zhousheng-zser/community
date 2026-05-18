/**
 * 直约技工默认头像：img/worker_avatars/1.png…6.png（按技工 id 循环槽位）
 * 使用小程序包内路径，勿走 imgUrl（config.uploadsImageSubdirs 含 worker_avatars 会误拼远程 /uploads 导致 404 白图）
 */

const SLOT_COUNT = 6;

/** 非数字 id（如 UUID）时仍稳定映射到 1…6 */
function hashStringToSlot(s) {
  const str = String(s || '');
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return (Math.abs(h) % SLOT_COUNT) + 1;
}

function workerAvatarUrl(workerId) {
  const id = Number(workerId);
  if (Number.isFinite(id) && id >= 1) {
    const slot = ((id - 1) % SLOT_COUNT) + 1;
    return `/img/worker_avatars/${slot}.png`;
  }
  if (workerId != null && String(workerId).trim() !== '') {
    const slot = hashStringToSlot(String(workerId));
    return `/img/worker_avatars/${slot}.png`;
  }
  return '/img/worker_avatars/1.png';
}

module.exports = {
  workerAvatarUrl,
  SLOT_COUNT
};
