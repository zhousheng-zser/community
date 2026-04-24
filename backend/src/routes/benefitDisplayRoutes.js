const express = require('express');
const router = express.Router();
const benefitDisplayController = require('../controllers/benefitDisplayController');

router.get('/display', benefitDisplayController.getDisplay);

module.exports = router;
