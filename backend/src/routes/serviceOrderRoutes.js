const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/serviceOrderController');

router.use(authMiddleware);
router.post('/', ctrl.create);
router.get('/my', ctrl.myList);
router.post('/:id/pay', ctrl.mockPay);

module.exports = router;
