const express = require('express');
const router = express.Router();
const jdBenefitController = require('../controllers/jdBenefitController');
const jdPromotionController = require('../controllers/jdPromotionController');

router.get('/benefit/goods', jdBenefitController.listGoods);
router.get('/promotion/spread-url', jdPromotionController.getSpreadUrl);

module.exports = router;
