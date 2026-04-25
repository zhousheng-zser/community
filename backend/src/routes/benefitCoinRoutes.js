const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const benefitCoinController = require('../controllers/benefitCoinController');

router.use(authMiddleware);

router.get('/balance', benefitCoinController.getBalance);
router.get('/goods', benefitCoinController.getExchangeGoods);
router.get('/goods/:goodsId', benefitCoinController.getExchangeGoodsDetail);
router.post('/exchange', benefitCoinController.exchangeGoods);
router.get('/records', benefitCoinController.getExchangeRecords);

module.exports = router;
