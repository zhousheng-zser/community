const express = require('express');
const router = express.Router();
const ctrl = require('./controllers/benefitAlliance.controller');

// 管理后台：惠民卡推广商品 CRUD
router.get('/benefit-alliance-goods', ctrl.adminList);
router.post('/benefit-alliance-goods', ctrl.adminCreate);
router.put('/benefit-alliance-goods/:id', ctrl.adminUpdate);
router.delete('/benefit-alliance-goods/:id', ctrl.adminDelete);

module.exports = router;
