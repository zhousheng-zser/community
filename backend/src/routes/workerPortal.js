/**
 * 技工端（小程序 package-worker）订单接口 — 与前端路径一致：/api/v1/worker/service-orders
 * 鉴权：需 Authorization: Bearer <token>（开发阶段仅校验存在，不验 JWT）。
 */
const express = require('express');
const c = require('../controllers/workerPortalController');

const router = express.Router();

function requireBearer(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ') || auth.length < 12) {
    return res.status(401).json({ errno: 401, errmsg: '请先登录' });
  }
  next();
}

router.use(requireBearer);

router.get('/service-orders', c.listServiceOrders);
router.get('/orders', c.listServiceOrders);

router.get('/service-orders/:id', c.getServiceOrder);

router.post('/service-orders/:id/accept', c.postAccept);
router.post('/service-orders/:id/reject', c.postReject);
router.post('/service-orders/:id/check-in', c.postCheckIn);
router.post('/service-orders/:id/evidence', c.postEvidence);
router.post('/service-orders/:id/addon-request', c.postAddonRequest);
router.post('/service-orders/:id/complete', c.postComplete);

module.exports = router;
