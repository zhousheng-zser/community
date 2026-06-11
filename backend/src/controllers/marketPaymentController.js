const crypto = require('crypto');
const {
  MarketOrder,
  MarketPayTransaction,
  ServiceOrder,
  User
} = require('../models');
const wechat = require('../utils/wechatPayV3');
const orderPoints = require('../services/orderPoints.service');
const commissionService = require('../modules/commission/services/commission.service');
const { applyServiceOrderStatusAfterPayment } = require('../utils/serviceOrderPaidTransition');
const { resolveUserIdFromReq } = require('../utils/resolveUserId');

function ok(data, msg = 'ok') {
  return { code: 0, msg, data };
}

function bizError(res, code, msg) {
  return res.status(200).json({ code, msg, data: null });
}

function fail(res, msg, statusCode = 400) {
  return res.status(statusCode).json({ code: 1, msg, data: null });
}

function genOutTradeNo() {
  return `${Date.now()}${Math.floor(Math.random() * 900000 + 100000)}`.slice(0, 32);
}

function isVirtualPayWhenWechatMissing() {
  return process.env.MARKET_PAY_VIRTUAL_SUCCESS !== 'false';
}

function buildVirtualWxPayParams() {
  const timeStamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const pkg = `prepay_id=VIRTUAL_${timeStamp}_${crypto.randomBytes(6).toString('hex')}`;
  const paySign = `VIRTUAL_${crypto.randomBytes(32).toString('hex')}`;
  return {
    timeStamp,
    nonceStr,
    package: pkg,
    signType: 'RSA',
    paySign,
    time_stamp: timeStamp,
    nonce_str: nonceStr,
    sign_type: 'RSA',
    pay_sign: paySign
  };
}

function orderPayAmount(order) {
  return Number(
    order.payable_amount != null ? order.payable_amount
      : order.pay_amount != null ? order.pay_amount
        : order.total_amount != null ? order.total_amount
          : order.amount != null ? order.amount : 0
  );
}

function buildPayResponse(orderNo, tx, wxPayParams, opts = {}) {
  const virtualPay = !!opts.virtual_pay;
  const payMode = opts.pay_mode || (virtualPay ? 'virtual' : 'wechat');
  return ok({
    order_no: orderNo,
    out_trade_no: tx.out_trade_no,
    amount: String(tx.amount),
    pay_mode: payMode,
    virtual_pay: virtualPay,
    payment_mode: payMode,
    wx_pay_params: wxPayParams,
    payment: { wx_pay_params: wxPayParams },
    jsapi: wxPayParams,
    timeStamp: wxPayParams.timeStamp,
    nonceStr: wxPayParams.nonceStr,
    package: wxPayParams.package,
    signType: wxPayParams.signType,
    paySign: wxPayParams.paySign,
    time_stamp: wxPayParams.time_stamp || wxPayParams.timeStamp,
    nonce_str: wxPayParams.nonce_str || wxPayParams.nonceStr
  });
}

async function applyMarketOrderPaid(order, userId) {
  if (order.pay_status === 'paid' && order.order_status !== 'pending_payment') {
    return order;
  }
  await order.update({
    pay_status: 'paid',
    order_status: 'pending_accept',
    paid_at: new Date()
  });
  await order.reload();
  try {
    await orderPoints.grantPointsOnOrderPaid(MarketOrder, order, null);
  } catch (e) {
    console.warn('[market/pay] grantPoints', e.message);
  }
  try {
    const payAmount = orderPayAmount(order);
    const pool = Number(order.platform_fee_amount || 0);
    if (payAmount > 0 && pool > 0) {
      await commissionService.distributeCommission(order.order_no, 'market', payAmount, userId, pool);
    } else if (payAmount > 0) {
      await commissionService.distributeCommission(order.order_no, 'market', payAmount, userId);
    }
  } catch (e) {
    console.warn('[market/pay] commission', e.message);
  }
  return order;
}

async function unifiedOrderWithRetry(tx, description, amountFen, openid) {
  const notifyUrl = process.env.WX_PAY_NOTIFY_URL;
  if (!notifyUrl) {
    throw new Error('缺少 WX_PAY_NOTIFY_URL（须为外网 HTTPS 可访问的完整回调地址）');
  }
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await wechat.jsapiUnifiedOrder({
        out_trade_no: tx.out_trade_no,
        description,
        amountFen,
        notify_url: notifyUrl,
        openid
      });
    } catch (e) {
      lastErr = e;
      const code = e.body && e.body.code;
      const detail = (e.body && (e.body.detail || e.body.message)) || '';
      const dup =
        code === 'INVALID_REQUEST' ||
        /商户订单号|out_trade_no|重复|已存在/i.test(String(detail));
      if (attempt === 0 && dup) {
        tx.out_trade_no = genOutTradeNo();
        await tx.save();
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

async function virtualPaySuccessFlow(order, orderNo, userId) {
  let tx = await MarketPayTransaction.findOne({ where: { order_no: orderNo, pay_status: 'created' } });
  const amount = orderPayAmount(order);
  if (!tx) {
    tx = await MarketPayTransaction.create({
      order_no: orderNo,
      out_trade_no: genOutTradeNo(),
      channel: 'wechat_jsapi',
      pay_status: 'created',
      amount
    });
  }
  const now = new Date();
  tx.pay_status = 'success';
  tx.transaction_id = `VIRTUAL_TX_${Date.now()}`;
  tx.paid_at = now;
  tx.notify_raw = { source: 'market-payments/create-virtual', order_no: orderNo };
  tx.notify_count = (tx.notify_count || 0) + 1;
  tx.last_notify_at = now;
  await tx.save();
  await applyMarketOrderPaid(order, userId);
  return { tx, wxPayParams: buildVirtualWxPayParams() };
}

exports.createPaymentGetNotAllowed = (req, res) => {
  res.status(405).json({ code: 405, msg: '请使用 POST', data: null });
};

exports.createPayment = async (req, res) => {
  try {
    const userId = resolveUserIdFromReq(req);
    if (!userId) return fail(res, '未登录', 401);
    const orderNo = String((req.body || {}).order_no || '').trim();
    if (!orderNo) return fail(res, '缺少 order_no');

    const order = await MarketOrder.findOne({ where: { order_no: orderNo, user_id: userId } });
    if (!order) return fail(res, '订单不存在', 404);
    if (order.order_status !== 'pending_payment' || order.pay_status !== 'unpaid') {
      return bizError(res, 20031, '订单状态不允许发起支付');
    }

    if (!wechat.isWechatPayConfigured()) {
      if (!isVirtualPayWhenWechatMissing()) {
        const cfg = wechat.getWechatPayConfigStatus();
        const parts = [];
        if (cfg.missing.length) parts.push(`缺少/非法: ${cfg.missing.join('、')}`);
        if (cfg.privateKeyLoadError) parts.push(`私钥读取失败: ${cfg.privateKeyLoadError}`);
        return bizError(res, 20044, `未配置微信支付，${parts.join('；')}`);
      }
      const { tx, wxPayParams } = await virtualPaySuccessFlow(order, orderNo, userId);
      return res.json(buildPayResponse(orderNo, tx, wxPayParams, { virtual_pay: true, pay_mode: 'virtual' }));
    }

    const user = await User.findByPk(userId);
    if (!user || !user.openid) {
      return bizError(res, 20043, '用户未绑定微信 openid，无法发起小程序支付');
    }

    const amount = orderPayAmount(order);
    const amountFen = wechat.yuanToFen(amount);
    if (amountFen <= 0) {
      return bizError(res, 20046, '订单金额为 0，请与运营确认是否免支付流程');
    }

    let tx = await MarketPayTransaction.findOne({ where: { order_no: orderNo, pay_status: 'created' } });
    if (!tx) {
      tx = await MarketPayTransaction.create({
        order_no: orderNo,
        out_trade_no: genOutTradeNo(),
        channel: 'wechat_jsapi',
        pay_status: 'created',
        amount
      });
    }

    let prepayResp;
    try {
      prepayResp = await unifiedOrderWithRetry(
        tx,
        `本地集市订单 ${orderNo}`.slice(0, 127),
        amountFen,
        user.openid
      );
    } catch (e) {
      console.error('[market/payments/create] jsapi:', e.body || e.message);
      const msg = (e.body && (e.body.message || e.body.detail)) || e.message || '微信统一下单失败';
      return bizError(res, 20045, String(msg).slice(0, 200));
    }

    const prepayId = prepayResp && prepayResp.prepay_id;
    if (!prepayId) return bizError(res, 20045, '微信未返回 prepay_id');

    const pay = wechat.buildJsapiPayParams(prepayId);
    const wxPayParams = {
      ...pay,
      time_stamp: pay.timeStamp,
      nonce_str: pay.nonceStr,
      sign_type: pay.signType,
      pay_sign: pay.paySign
    };
    return res.json(buildPayResponse(orderNo, tx, wxPayParams, { virtual_pay: false, pay_mode: 'wechat' }));
  } catch (e) {
    console.error('[market/payments/create]', e);
    return fail(res, '创建支付失败', 500);
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const userId = resolveUserIdFromReq(req);
    if (!userId) return fail(res, '未登录', 401);
    const orderNo = String(req.query.order_no || '').trim();
    if (!orderNo) return fail(res, '缺少 order_no');

    const order = await MarketOrder.findOne({ where: { order_no: orderNo, user_id: userId } });
    if (!order) return fail(res, '订单不存在', 404);

    return res.json(
      ok({
        order_no: orderNo,
        pay_status: order.pay_status,
        order_status: order.order_status
      })
    );
  } catch (e) {
    console.error('[market/payments/status]', e);
    return fail(res, '查询支付状态失败', 500);
  }
};

exports.mockSuccess = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ code: 403, msg: '生产环境禁用该接口', data: null });
    }
    const userId = resolveUserIdFromReq(req);
    if (!userId) return fail(res, '未登录', 401);
    const orderNo = String((req.body || {}).order_no || '').trim();
    if (!orderNo) return fail(res, '缺少 order_no');

    const order = await MarketOrder.findOne({ where: { order_no: orderNo, user_id: userId } });
    if (!order) return fail(res, '订单不存在', 404);
    if (order.order_status !== 'pending_payment') return fail(res, '当前订单不可模拟支付');

    let tx = await MarketPayTransaction.findOne({ where: { order_no: orderNo }, order: [['created_at', 'DESC']] });
    if (!tx) {
      tx = await MarketPayTransaction.create({
        order_no: orderNo,
        out_trade_no: genOutTradeNo(),
        channel: 'wechat_jsapi',
        pay_status: 'created',
        amount: orderPayAmount(order)
      });
    }
    if (tx.pay_status !== 'success') {
      tx.pay_status = 'success';
      tx.transaction_id = `MOCK_TX_${Date.now()}`;
      tx.paid_at = new Date();
      tx.notify_raw = { source: 'mock-success-api', order_no: orderNo };
      tx.notify_count = (tx.notify_count || 0) + 1;
      tx.last_notify_at = new Date();
      await tx.save();
    }
    await applyMarketOrderPaid(order, userId);
    return res.json(
      ok({
        order_no: order.order_no,
        pay_status: order.pay_status,
        order_status: order.order_status
      }, '支付成功')
    );
  } catch (e) {
    console.error('[market/payments/mock-success]', e);
    return fail(res, '模拟支付失败', 500);
  }
};

async function handlePaidNotify(tx, plain) {
  const tradeState = plain.trade_state || plain.tradeState;
  if (tradeState && tradeState !== 'SUCCESS') return false;

  const now = new Date();
  if (tx.pay_status !== 'success') {
    tx.pay_status = 'success';
    tx.transaction_id = plain.transaction_id || tx.transaction_id;
    tx.paid_at = plain.success_time ? new Date(plain.success_time) : now;
    tx.notify_raw = plain;
    tx.notify_count = (tx.notify_count || 0) + 1;
    tx.last_notify_at = now;
    await tx.save();
  }

  const orderNo = tx.order_no;
  const marketOrder = await MarketOrder.findOne({ where: { order_no: orderNo } });
  if (marketOrder) {
    await applyMarketOrderPaid(marketOrder, marketOrder.user_id);
    return true;
  }

  const serviceOrder = await ServiceOrder.findOne({ where: { order_no: orderNo } });
  if (serviceOrder && serviceOrder.pay_status !== 'paid') {
    serviceOrder.pay_status = 'paid';
    applyServiceOrderStatusAfterPayment(serviceOrder);
    await serviceOrder.save();
    return true;
  }
  return true;
}

exports.payCallback = async (req, res) => {
  try {
    const { plain } = await wechat.verifyAndDecryptNotify(req);
    const outTradeNo = plain.out_trade_no;
    if (!outTradeNo) {
      return res.status(400).json({ code: 'FAIL', message: '缺少 out_trade_no' });
    }

    let tx = await MarketPayTransaction.findOne({ where: { out_trade_no: outTradeNo } });
    if (!tx) {
      console.warn('[market/pay/callback] 未知 out_trade_no:', outTradeNo);
      return res.json({ code: 'SUCCESS', message: '成功' });
    }

    if (tx.pay_status === 'success') {
      return res.json({ code: 'SUCCESS', message: '成功' });
    }

    await handlePaidNotify(tx, plain);
    return res.json({ code: 'SUCCESS', message: '成功' });
  } catch (e) {
    console.error('[market/pay/callback]', e);
    return res.status(500).json({ code: 'FAIL', message: e.message || '处理失败' });
  }
};
