const express = require('express');
const router = express.Router();
const ctrl = require('./controllers/benefitAlliance.controller');

router.get('/benefit/display', ctrl.getDisplay);
router.get('/jd/benefit/goods', ctrl.getJdGoods);
router.get('/jd/promotion/spread-url', ctrl.getJdSpreadUrl);
router.get('/pdd/benefit/goods', ctrl.getPddGoods);
router.get('/pdd/promotion/spread-url', ctrl.getPddSpreadUrl);

module.exports = router;
