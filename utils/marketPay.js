/**
 * 本地集市 / 到家服务 微信支付公共逻辑
 */
const util = require('./util.js');
const config = require('./config.js');

const PAID_STATUSES = new Set(['paid', 'success', 'paid_success']);

const WX_PAY_ERROR_MESSAGES = {
  20031: '订单状态已变化，请刷新后重试',
  20043: '请重新微信登录后再支付',
  20044: '支付未配置，请联系客服',
  20046: '该订单无需在线支付'
};

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

function summarizePayDataKeys(payData, depth = 0) {
  if (!payData || typeof payData !== 'object' || depth > 3) return '';
  const keys = Object.keys(payData);
  return keys.map((key) => {
    const v = payData[key];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return `${key}:{${summarizePayDataKeys(v, depth + 1)}}`;
    }
    return key;
  }).join(',');
}

function isPaidStatus(payStatus) {
  return PAID_STATUSES.has(String(payStatus || '').toLowerCase());
}

/** 是否应调起真实微信收银台（与后端文档一致） */
function isRealWxPayParams(payData) {
  if (!payData || typeof payData !== 'object') return false;
  if (payData.virtual_pay === true) return false;
  const payMode = payData.pay_mode || payData.payment_mode || payData.payMode;
  if (payMode === 'virtual' || payMode === 'mock') return false;
  const params = extractWxPayParams(payData);
  if (!params) return false;
  if (params.signType !== 'RSA') return false;
  return String(params.package || '').startsWith('prepay_id=wx');
}

function mapWxPayError(err) {
  if (!err) return '支付发起失败，请稍后再试';
  const code = Number(err.errno != null ? err.errno : err.code);
  if (WX_PAY_ERROR_MESSAGES[code]) {
    if (code === 20045) {
      return err.errmsg || err.msg || err.message || WX_PAY_ERROR_MESSAGES[code];
    }
    return WX_PAY_ERROR_MESSAGES[code];
  }
  return err.errmsg || err.msg || err.message || '支付发起失败，请稍后再试';
}

function pollPayStatus(orderNo, statusPath, options = {}) {
  const {
    redirectToDetail = false,
    onPaid,
    detailUrl
  } = options;
  const tryTimes = 20;
  const intervalMs = 1500;
  let count = 0;
  const detailPage = detailUrl || `../market-order-detail/market-order-detail?orderNo=${orderNo}`;

  return new Promise((resolve) => {
    const tick = async () => {
      count += 1;
      const quiet = options.quiet === true;
      try {
        const statusRes = await util.get(statusPath, { order_no: orderNo });
        const statusData = statusRes && statusRes.data ? statusRes.data : statusRes;
        const payStatus = statusData && (statusData.pay_status || statusData.payStatus);
        if (!quiet && count >= tryTimes - 1) {
          wx.showToast({ title: `支付状态：${payStatus || 'unknown'}`, icon: 'none' });
        }
        if (isPaidStatus(payStatus)) {
          wx.showToast({ title: '支付成功', icon: 'success' });
          if (typeof onPaid === 'function') {
            try { onPaid(); } catch (e) { /* ignore */ }
          }
          if (redirectToDetail) {
            wx.redirectTo({ url: detailPage });
          }
          resolve(true);
          return;
        }
        if (count >= tryTimes) {
          if (!quiet) {
            wx.showToast({ title: `支付结束但未确认（状态：${payStatus || 'unknown'}）`, icon: 'none' });
          }
          if (redirectToDetail) {
            wx.redirectTo({ url: detailPage });
          }
          resolve(false);
          return;
        }
        setTimeout(tick, intervalMs);
      } catch (e) {
        if (count >= tryTimes) {
          if (!quiet) wx.showToast({ title: '查询支付状态失败', icon: 'none' });
          if (redirectToDetail) wx.redirectTo({ url: detailPage });
          resolve(false);
          return;
        }
        setTimeout(tick, intervalMs);
      }
    };
    tick();
  });
}

function pollMarketPayStatus(orderNo, options) {
  return pollPayStatus(orderNo, 'market/payments/status', options);
}

async function startPaymentFlow(orderNo, createPath, statusPath, options = {}) {
  const {
    redirectToDetail = true,
    onPaid,
    requestPaymentDelayMs = 280,
    detailUrl
  } = options;

  try {
    wx.showLoading({ title: '拉起支付中...', mask: true });
    const payData = await util.post(createPath, { order_no: orderNo });
    wx.hideLoading();

    const outTradeNo = payData && (payData.out_trade_no || payData.outTradeNo);
    if (outTradeNo) wx.setStorageSync('last_market_out_trade_no', outTradeNo);
    wx.setStorageSync('last_market_order_no', orderNo);

    if (payData && payData.virtual_pay === true) {
      if (config.enableMockPay) {
        wx.showToast({ title: '开发联调：虚拟支付', icon: 'none', duration: 2200 });
        await pollPayStatus(orderNo, statusPath, { quiet: false, redirectToDetail, onPaid, detailUrl });
        return;
      }
      wx.showToast({ title: '未获取到微信支付参数', icon: 'none' });
      return;
    }

    if (!isRealWxPayParams(payData)) {
      console.warn('[wxPay] 非真实支付参数:', summarizePayDataKeys(payData));
      wx.showToast({ title: '未获取到微信支付参数', icon: 'none' });
      if (redirectToDetail !== false && detailUrl) {
        wx.redirectTo({ url: detailUrl });
      }
      return;
    }

    const payParams = extractWxPayParams(payData);
    if (!payParams) {
      wx.showToast({ title: '未获取到微信支付参数', icon: 'none' });
      return;
    }

    setTimeout(() => {
      const pollOptions = {
        quiet: false,
        redirectToDetail,
        onPaid,
        detailUrl
      };
      // 开发者工具扫码支付时 success 回调可能不触发，须与收银台并行轮询
      pollPayStatus(orderNo, statusPath, pollOptions);

      wx.requestPayment({
        timeStamp: payParams.timeStamp,
        nonceStr: payParams.nonceStr,
        package: payParams.package,
        signType: payParams.signType,
        paySign: payParams.paySign,
        success: () => {},
        fail: () => {
          wx.showToast({ title: '取消支付或支付失败', icon: 'none' });
          pollOptions.quiet = true;
        }
      });
    }, requestPaymentDelayMs);
  } catch (e) {
    wx.hideLoading();
    wx.showToast({ title: mapWxPayError(e), icon: 'none', duration: 2800 });
    if (redirectToDetail !== false && detailUrl) {
      setTimeout(() => wx.redirectTo({ url: detailUrl }), 800);
    }
  }
}

async function startMarketPaymentFlow(orderNo, options = {}) {
  return startPaymentFlow(orderNo, 'market/payments/create', 'market/payments/status', {
    detailUrl: `../market-order-detail/market-order-detail?orderNo=${orderNo}`,
    ...options
  });
}

module.exports = {
  extractWxPayParams,
  tryParseWxPayFlat,
  isRealWxPayParams,
  isPaidStatus,
  mapWxPayError,
  pollMarketPayStatus,
  pollPayStatus,
  startMarketPaymentFlow,
  startPaymentFlow
};
