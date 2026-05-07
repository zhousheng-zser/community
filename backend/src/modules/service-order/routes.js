const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const ctrl = require('./controllers/serviceOrder.controller');

router.use(authMiddleware);

router.post('/', ctrl.create);
router.get('/my', ctrl.getMyList);
router.get('/:id', ctrl.getDetail);
router.post('/:id/mock-pay', ctrl.mockPay);
router.post('/:id/confirm', ctrl.confirm);

module.exports = router;
