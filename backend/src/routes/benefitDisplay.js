const express = require('express');
const router = express.Router();
const { getDisplay } = require('../controllers/benefitDisplayController');

router.get('/display', getDisplay);

module.exports = router;
