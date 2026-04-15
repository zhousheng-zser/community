const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/neighborAssistController');

router.use(authMiddleware);
router.post('/orders', ctrl.create);
router.get('/orders/my', ctrl.myList);
router.post('/orders/:id/pay', ctrl.mockPay);

module.exports = router;
