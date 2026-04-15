const express = require('express');
const router = express.Router();
const livesController = require('../controllers/livesController');

router.get('/active', livesController.getActive);

module.exports = router;
