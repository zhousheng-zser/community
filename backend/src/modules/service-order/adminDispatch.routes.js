const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const ctrl = require('./controllers/adminDispatch.controller');

router.use(authMiddleware);
router.get('/dispatch-queue', ctrl.queue);
router.post('/service-orders/:id/assign', ctrl.assignWorker);

module.exports = router;
