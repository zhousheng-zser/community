const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/apply', authMiddleware, applicationController.workerApply);

module.exports = router;
