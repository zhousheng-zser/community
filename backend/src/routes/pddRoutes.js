const express = require('express');
const router = express.Router();
const pddBenefitController = require('../controllers/pddBenefitController');
const pddPromotionController = require('../controllers/pddPromotionController');

router.get('/benefit/goods', pddBenefitController.listGoods);
router.get('/promotion/spread-url', pddPromotionController.getSpreadUrl);

module.exports = router;
