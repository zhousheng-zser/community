const express = require('express');
const router = express.Router();
const adminAuthMiddleware = require('../middlewares/adminAuthMiddleware');
const adminServiceHomeController = require('../controllers/adminServiceHomeController');

router.use(adminAuthMiddleware);

router.get('/service-home/modules', adminServiceHomeController.listModules);
router.post('/service-home/modules', adminServiceHomeController.createModule);
router.put('/service-home/modules/:id', adminServiceHomeController.updateModule);
router.delete('/service-home/modules/:id', adminServiceHomeController.deleteModule);

router.get('/service-home/categories', adminServiceHomeController.listCategories);
router.post('/service-home/categories', adminServiceHomeController.createCategory);
router.put('/service-home/categories/:id', adminServiceHomeController.updateCategory);
router.delete('/service-home/categories/:id', adminServiceHomeController.deleteCategory);

router.get('/service-home/services', adminServiceHomeController.listServices);
router.post('/service-home/services', adminServiceHomeController.createService);
router.put('/service-home/services/:id', adminServiceHomeController.updateService);
router.delete('/service-home/services/:id', adminServiceHomeController.deleteService);

module.exports = router;
