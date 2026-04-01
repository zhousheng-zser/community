const express = require('express');
const { listGoods, getSpreadUrl } = require('../controllers/jdBenefitController');

const router = express.Router();

router.get('/benefit/goods', listGoods);
router.get('/promotion/spread-url', getSpreadUrl);

module.exports = router;
