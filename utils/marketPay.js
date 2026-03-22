/**
 * 家集市微信支付（JSAPI）公共逻辑
 * - 避免与 wx.showToast 连续调用导致真机无法拉起收银台
 * - 供「确认订单」「订单详情-继续支付」复用
 *
 * 开发阶段无商户参数时（见 API_DOC.md 12.4）：后端可返回 virtual_pay:true + 占位五参。
 * 占位参数不能调起真实收银台，此处 **不调用 wx.requestPayment**，仅轮询状态/刷新订单。
 */
const util = require('./util.js');

/** 从单层对象解析五参数（含蛇形、prepay_id 兜底） */
function tryParseWxPayFlat(p) {
  if (!p || typeof p !== 'object') return null;
  const timeStamp = p.timeStamp || p.timestamp || p.time_stamp;
  const nonceStr = p.nonceStr || p.nonce_str;
  let pkg = p.package || p.pkg || p.pack;
  if (!pkg && (p.prepay_id != null || p.prepayId != null)) {
    const raw = p.prepay_id != null ? p.prepay_id : p.prepayId;
    const s = String(raw).replace(/^prepay_id=/, '');
    pkg = 'prepay_id=' + s;
  }
  const signType = p.signType || p.sign_type;
  const paySign = p.paySign || p.pay_sign || p.sign;
  if (timeStamp && nonceStr && pkg && signType && paySign) {
    return {
      timeStamp: String(timeStamp),
      nonceStr: String(nonceStr),
      package: String(pkg),
      signType: String(signType),
      paySign: String(paySign)
    };
  }
  return null;
}

const NEST_KEYS = [
  'pay_params',
  'wx_pay_params',
  'jsapi_params',
  'jsapi',
  'wx_pay',
  'payment',
  'data',
  'result',
  'payload',
  'params',
  'mini_pay_request',
  'miniPayRequest'
];

/**
 * 递归解析 BE 可能嵌套的 JSAPI 对象（如 data.payment.wx_pay_params）
 */
function extractWxPayParams(payData, depth = 0) {
  if (!payData || typeof payData !== 'object' || depth > 10) return null;

  const flat = tryParseWxPayFlat(payData);
  if (flat) return flat;

  for (let i = 0; i < NEST_KEYS.length; i++) {
    const k = NEST_KEYS[i];
    const child = payData[k];
    if (child != null && typeof child === 'object') {
      const nested = extractWxPayParams(child, depth + 1);
      if (nested) return nested;
    }
  }
  return null;
}

/** 供调试：打印嵌套结构（不含敏感值） */
function summarizePayDataKeys(payData, depth = 0) {
  if (!payData || typeof payData !== 'object' || depth > 3) return '';
  const keys = Object.keys(payData);
  const parts = keys.map((key) => {
    const v = payData[key];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return `${key}:{${summarizePayDataKeys(v, depth + 1)}}`;
    }
    return key;
  });
  return parts.join(',');
}

function pollMarketPayStatus(orderNo, { quiet = false, redirectToDetail = false, onPaid } = {}) {
  const tryTimes = 20;
  const intervalMs = 1500;
  let count = 0;

  return new Promise((resolve) => {
    const tick = async () => {
      count += 1;
      try {
        const statusRes = await util.get('market/payments/status', { order_no: orderNo });
        const statusData = statusRes && statusRes.data ? statusRes.data : statusRes;
        const payStatus = statusData && (statusData.pay_status || statusData.payStatus);
        if (!quiet) {
          if (count >= tryTimes - 1) {
            wx.showToast({ title: `支付状态：${payStatus || 'unknown'}`, icon: 'none' });
          }
        }

        if (payStatus === 'paid' || payStatus === 'success' || payStatus === 'paid_success') {
          wx.showToast({ title: '支付成功', icon: 'success' });
          if (typeof onPaid === 'function') {
            try {
              onPaid();
            } catch (e) { /* ignore */ }
          }
          if (redirectToDetail) {
            wx.redirectTo({ url: `../market-order-detail/market-order-detail?orderNo=${orderNo}` });
          }
          resolve(true);
          return;
        }

        if (count >= tryTimes) {
          wx.showToast({ title: `支付结束但未确认（状态：${payStatus || 'unknown'}）`, icon: 'none' });
          if (redirectToDetail) {
            wx.redirectTo({ url: `../market-order-detail/market-order-detail?orderNo=${orderNo}` });
          }
          resolve(false);
          return;
        }
        setTimeout(tick, intervalMs);
      } catch (e) {
        if (count >= tryTimes) {
          if (!quiet) wx.showToast({ title: '查询支付状态失败', icon: 'none' });
          if (redirectToDetail) {
            wx.redirectTo({ url: `../market-order-detail/market-order-detail?orderNo=${orderNo}` });
          }
          resolve(false);
          return;
        }
        setTimeout(tick, intervalMs);
      }
    };
    tick();
  });
}

/**
 * @param {string} orderNo
 * @param {{ redirectToDetail?: boolean, onPaid?: function, requestPaymentDelayMs?: number }} [options]
 *   redirectToDetail: 轮询成功后是否跳转订单详情（在详情页内继续支付时应为 false）
 *   onPaid: 支付确认成功后的回调（如刷新当前页）
 *   requestPaymentDelayMs: 真机上调起前延迟，避免与 toast/loading 冲突
 */
async function startMarketPaymentFlow(orderNo, options = {}) {
  const {
    redirectToDetail = true,
    onPaid,
    requestPaymentDelayMs = 280
  } = options;

  try {
    wx.showLoading({ title: '拉起支付中...', mask: true });

    const payRes = await util.post('market/payments/create', { order_no: orderNo });
    if (payRes && typeof payRes === 'object' && payRes.code != null && payRes.code !== 0) {
      wx.hideLoading();
      wx.showToast({ title: payRes.msg || '创建支付失败', icon: 'none' });
      if (redirectToDetail !== false) {
        wx.redirectTo({ url: `../market-order-detail/market-order-detail?orderNo=${orderNo}` });
      }
      return;
    }
    const payData = payRes && payRes.data != null ? payRes.data : payRes;

    const outTradeNo = payData && (payData.out_trade_no || payData.outTradeNo);
    if (outTradeNo) {
      wx.setStorageSync('last_market_out_trade_no', outTradeNo);
    }
    wx.setStorageSync('last_market_order_no', orderNo);

    wx.hideLoading();

    const payMode = payData && (payData.pay_mode || payData.payment_mode || payData.payMode);
    // API_DOC 12.4：virtual_pay === true 时为临时虚拟支付，占位五参不可调起真收银台
    const isVirtualPay =
      payData &&
      (payData.virtual_pay === true ||
        payMode === 'virtual' ||
        payMode === 'mock');
    if (isVirtualPay) {
      wx.showToast({
        title: '开发联调：虚拟支付（未调起微信收银台）',
        icon: 'none',
        duration: 2200
      });
      await pollMarketPayStatus(orderNo, {
        quiet: false,
        redirectToDetail,
        onPaid
      });
      return;
    }

    const payParams = extractWxPayParams(payData);
    if (!payParams) {
      try {
        console.warn('[marketPay] payments/create 无可用 JSAPI 参数。结构:', summarizePayDataKeys(payData));
        console.warn('[marketPay] 若后端已返回 wx_pay_params，请检查是否多包了一层 data/payment');
      } catch (e) { /* ignore */ }
      wx.showToast({ title: '未获取到微信支付参数，请检查后端支付配置', icon: 'none' });
      if (redirectToDetail !== false) {
        wx.redirectTo({ url: `../market-order-detail/market-order-detail?orderNo=${orderNo}` });
      }
      return;
    }

    // 勿在 requestPayment 前立刻 showToast：部分真机会导致收银台无法弹出
    setTimeout(() => {
      wx.requestPayment({
        timeStamp: payParams.timeStamp,
        nonceStr: payParams.nonceStr,
        package: payParams.package,
        signType: payParams.signType,
        paySign: payParams.paySign,
        success: async () => {
          await pollMarketPayStatus(orderNo, {
            quiet: false,
            redirectToDetail,
            onPaid
          });
        },
        fail: async () => {
          wx.showToast({ title: '取消支付或支付失败', icon: 'none' });
          await pollMarketPayStatus(orderNo, {
            quiet: true,
            redirectToDetail,
            onPaid
          });
        }
      });
    }, requestPaymentDelayMs);
  } catch (e) {
    wx.hideLoading();
    wx.showToast({ title: '支付发起失败，请稍后再试', icon: 'none' });
  }
}

module.exports = {
  extractWxPayParams,
  tryParseWxPayFlat,
  pollMarketPayStatus,
  startMarketPaymentFlow
};
