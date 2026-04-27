const express = require('express');
const router = express.Router();
const ctrl = require('./controllers/benefitAlliance.controller');

// 公开接口：小程序调用
router.get('/goods', ctrl.getGoods);
router.get('/display', ctrl.getDisplay);

// 兼容旧路径
router.get('/jd/benefit/goods', ctrl.getJdGoods);
router.get('/pdd/benefit/goods', ctrl.getPddGoods);

module.exports = router;
