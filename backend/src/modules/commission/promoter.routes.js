const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const promoterController = require('./controllers/promoter.controller');

router.use(authMiddleware);

router.get('/commission', promoterController.getCommission);
router.get('/orders', promoterController.getOrders);
router.get('/income-records', promoterController.getIncomeRecords);
router.post('/withdraw', promoterController.withdraw);
router.get('/share-link', promoterController.getShareLink);

module.exports = router;
