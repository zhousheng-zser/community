const express = require('express');
const { adminAuthMiddleware } = require('../middleware/adminAuth');
const {
  list,
  create,
  update,
  destroy
} = require('../controllers/adminJdBenefitGoodsController');

const router = express.Router();

router.use(adminAuthMiddleware);

router.get('/jd-benefit-goods', list);
router.post('/jd-benefit-goods', create);
router.put('/jd-benefit-goods/:id', update);
router.delete('/jd-benefit-goods/:id', destroy);

module.exports = router;
