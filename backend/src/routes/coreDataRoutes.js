const express = require('express');
const router = express.Router();
const coreDataController = require('../controllers/coreDataController');

// 这些接口都是公开只读的，所以暂不加 authMiddleware
router.get('/banners', coreDataController.getBanners);
router.get('/categories', coreDataController.getCategories);
router.get('/services/hot', coreDataController.getHotServices);
router.get('/categories/:categoryId/services', coreDataController.getServicesByCategory);
router.get('/services/:id', coreDataController.getServiceDetail);

module.exports = router;
