/**
 * 惠民卡 / 多多进宝：推广链接（H5 + 拼多多小程序路径）
 * 优先读库 pdd_benefit_goods；其次演示映射；可配置 PDD_* 走开放平台转链。
 */

const crypto = require('crypto');
const axios = require('axios');
const { Op } = require('sequelize');
const { PddBenefitGood } = require('../models');

const PDD_ROUTER = 'https://gw-api.pinduoduo.com/api/router';

/** 演示商品：与惠民卡列表里的 pdd_demo_* 对齐 */
const DEMO_SPREAD = {
  pdd_demo_1: {
    spreadUrl: 'https://mobile.yangkeduo.com/goods.html?goods_id=1&_wv=41729&_wvx=10',
    miniPath: 'pages/goods/goods?goods_id=1&_smp=benefit_demo_1'
  },
  pdd_demo_2: {
    spreadUrl: 'https://mobile.yangkeduo.com/goods.html?goods_id=2&_wv=41729&_wvx=10',
    miniPath: 'pages/goods/goods?goods_id=2&_smp=benefit_demo_2'
  },
  pdd_demo_3: {
    spreadUrl: 'https://mobile.yangkeduo.com/goods.html?goods_id=3&_wv=41729&_wvx=10',
    miniPath: 'pages/goods/goods?goods_id=3&_smp=benefit_demo_3'
  },
  pdd_demo_4: {
    spreadUrl: 'https://mobile.yangkeduo.com/goods.html?goods_id=4&_wv=41729&_wvx=10',
    miniPath: 'pages/goods/goods?goods_id=4&_smp=benefit_demo_4'
  }
};

function ok(res, data) {
  res.json({ errno: 0, data });
}

function pddSign(params, clientSecret) {
  const keys = Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== undefined && params[k] !== '')
    .sort();
  let s = clientSecret;
  for (const k of keys) {
    s += k;
    s += params[k];
  }
  s += clientSecret;
  return crypto.createHash('md5').update(s, 'utf8').digest('hex').toUpperCase();
}

async function callPddRouter(businessParams) {
  const clientId = process.env.PDD_CLIENT_ID;
  const clientSecret = process.env.PDD_CLIENT_SECRET;
  const accessToken = process.env.PDD_ACCESS_TOKEN;
  if (!clientId || !clientSecret || !accessToken) {
    return { skip: true };
  }
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = {
    type: 'pdd.ddk.goods.promotion.url.generate',
    client_id: clientId,
    timestamp,
    data_type: 'JSON',
    access_token: accessToken,
    ...businessParams
  };
  params.sign = pddSign(params, clientSecret);
  const form = new URLSearchParams();
  Object.keys(params).forEach((k) => {
    if (params[k] !== undefined && params[k] !== '') {
      const v = params[k];
      form.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
  });
  const { data } = await axios.post(PDD_ROUTER, form.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000
  });
  return { skip: false, data };
}

/**
 * GET /promotion/spread-url?goods_id=pdd_demo_3&scene=benefit_card
 * 可选：goods_sign=xxx（与 PDD_CLIENT_ID、PDD_CLIENT_SECRET、PDD_ACCESS_TOKEN、PDD_PID 联用走真实转链）
 */
exports.getSpreadUrl = async (req, res) => {
  try {
    const goodsId = req.query.goods_id;
    const scene = req.query.scene || 'benefit_card';
    const goodsSign = req.query.goods_sign;

    if (!goodsId && !goodsSign) {
      return res.status(400).json({ errno: 400, errmsg: '缺少 goods_id 或 goods_sign' });
    }

    if (goodsId) {
      const row = await PddBenefitGood.findOne({
        where: {
          scene,
          status: 1,
          [Op.or]: [{ goods_id: String(goodsId) }, { link_key: String(goodsId) }]
        }
      });
      if (row) {
        return ok(res, {
          spreadUrl: row.spread_url,
          miniPath: row.mini_path || '',
          scene,
          goodsId
        });
      }
    }

    if (goodsId && DEMO_SPREAD[goodsId]) {
      return ok(res, { ...DEMO_SPREAD[goodsId], scene, goodsId });
    }

    const pid = process.env.PDD_PID;
    if (goodsSign && pid) {
      const result = await callPddRouter({
        p_id: pid,
        goods_sign_list: JSON.stringify([goodsSign]),
        generate_short_url: true,
        generate_we_app: true
      });
      if (!result.skip && result.data) {
        const body = result.data;
        if (body.error_response) {
          return res.status(502).json({
            errno: 502,
            errmsg: body.error_response.error_msg || '拼多多接口错误',
            details: body.error_response
          });
        }
        const resp = body.goods_promotion_url_generate_response;
        if (resp && resp.goods_promotion_url_list && resp.goods_promotion_url_list[0]) {
          const item = resp.goods_promotion_url_list[0];
          return ok(res, {
            spreadUrl: item.url || item.mobile_short_url || item.mobile_url || '',
            miniPath: item.we_app_info ? item.we_app_info.page_path : '',
            scene,
            goodsId: goodsId || null,
            goodsSign
          });
        }
      }
    }

    if (goodsId) {
      return res.status(404).json({
        errno: 404,
        errmsg: '未找到该商品的推广映射，请配置联盟转链或检查 goods_id'
      });
    }

    return res.status(400).json({
      errno: 400,
      errmsg: '未配置 PDD_PID、PDD_ACCESS_TOKEN 等或缺少演示 goods_id，无法生成推广链接'
    });
  } catch (e) {
    console.error('[pdd promotion spread-url]', e.message);
    return res.status(500).json({ errno: 500, errmsg: '服务异常', details: e.message });
  }
};
