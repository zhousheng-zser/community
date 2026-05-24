/**
 * Promise 超时兜底（避免 wx.request / getLocation 无回调时界面一直 loading）
 */
function withTimeout(promise, ms, label) {
  const n = Number(ms) > 0 ? Number(ms) : 12000;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject({
          errno: 'ETIMEOUT',
          errmsg: label ? `${label}超时` : '请求超时'
        });
      }, n);
    })
  ]);
}

module.exports = { withTimeout };
