const express = require('express');
const router = express.Router();
const ctrl = require('./controllers/core.controller');

router.get('/banners', ctrl.getBanners);
router.get('/categories', ctrl.getCategories);
router.get('/services/hot', ctrl.getHotServices);
router.get('/services', ctrl.getServices);
router.get('/services/:id', ctrl.getServiceDetail);
router.get('/workers', ctrl.getWorkers);
router.get('/workers/:id', ctrl.getWorkerDetail);
router.get('/service-providers', ctrl.getServiceProviders);
router.get('/communities', ctrl.getCommunities);

module.exports = router;
