const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/benefitAllianceGoodsController');

router.get('/goods', ctrl.getGoods);
router.get('/display', ctrl.getDisplay);
router.get('/jd/benefit/goods', ctrl.getJdGoods);
router.get('/pdd/benefit/goods', ctrl.getPddGoods);

module.exports = router;
