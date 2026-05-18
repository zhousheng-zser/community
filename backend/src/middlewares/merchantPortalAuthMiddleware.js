const jwt = require('jsonwebtoken');
const { MarketApplication, MarketShop } = require('../models');
const { resolveUserId } = require('../utils/resolveUserId');

async function resolveShopIdFromUserToken(decoded) {
  const userId = resolveUserId(decoded && (decoded.id || decoded.user_id || decoded.sub));
  if (!userId) return null;
  const latestApprovedApp = await MarketApplication.findOne({
    where: { user_id: userId, status: 'approved' },
    attributes: ['shop_name', 'phone'],
    order: [['created_at', 'DESC'], ['id', 'DESC']]
  });
  if (!latestApprovedApp) return null;
  const shop = await MarketShop.findOne({
    where: {
      name: latestApprovedApp.shop_name,
      contact_phone: latestApprovedApp.phone,
      is_active: 1
    },
    attributes: ['id'],
    order: [['id', 'DESC']]
  });
  return shop ? Number(shop.id) : null;
}

async function resolveFallbackShopId(req) {
  const shopIdFromReq =
    (req.query && req.query.shop_id) ||
    (req.body && req.body.shop_id) ||
    process.env.DEBUG_DEFAULT_SHOP_ID;
  if (shopIdFromReq) {
    const shop = await MarketShop.findOne({
      where: { id: Number(shopIdFromReq), is_active: 1 },
      attributes: ['id']
    });
    if (shop) return Number(shop.id);
  }
  const firstActiveShop = await MarketShop.findOne({
    where: { is_active: 1 },
    attributes: ['id'],
    order: [['id', 'ASC']]
  });
  return firstActiveShop ? Number(firstActiveShop.id) : null;
}

/** 服务商/店铺后台 JWT：payload 须含 portal=merchant 与 shop_id */
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const debugSkipMerchantToken = process.env.DEBUG_SKIP_MERCHANT_TOKEN === '1';
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (debugSkipMerchantToken) {
      const fallbackShopId = await resolveFallbackShopId(req);
      if (fallbackShopId) {
        req.merchantAuth = {
          portal: 'merchant',
          shop_id: fallbackShopId,
          via: 'debug_no_token'
        };
        return next();
      }
    }
    return res.status(401).json({ errno: 401, code: 401, msg: '未登录', errmsg: '未登录' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    if (decoded && decoded.portal === 'merchant' && decoded.shop_id) {
      req.merchantAuth = decoded;
      return next();
    }

    // 测试联调用：允许用户 token 直连商户端 API（需显式开启）
    if (debugSkipMerchantToken) {
      const shopId = await resolveShopIdFromUserToken(decoded);
      if (shopId) {
        req.merchantAuth = {
          ...decoded,
          portal: 'merchant',
          shop_id: shopId,
          via: 'debug_user_token'
        };
        return next();
      }
      const fallbackShopId = await resolveFallbackShopId(req);
      if (fallbackShopId) {
        req.merchantAuth = {
          ...decoded,
          portal: 'merchant',
          shop_id: fallbackShopId,
          via: 'debug_fallback_shop'
        };
        return next();
      }
    }
    return res.status(403).json({ errno: 403, code: 403, msg: '非商户令牌', errmsg: '非商户令牌' });
  } catch (e) {
    return res.status(401).json({ errno: 401, code: 401, msg: '无效令牌', errmsg: '无效或已过期的 Token' });
  }
};
