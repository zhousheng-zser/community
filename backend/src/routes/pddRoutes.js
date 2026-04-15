const express = require('express');
const router = express.Router();
const pddPromotionController = require('../controllers/pddPromotionController');

router.get('/promotion/spread-url', pddPromotionController.getSpreadUrl);

module.exports = router;
