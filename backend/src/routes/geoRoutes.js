const express = require('express');
const router = express.Router();
const coreCtrl = require('../modules/core/controllers/core.controller');

/** GET /api/v1/geo/communities — 小区列表（前端地理/入驻选社区） */
router.get('/communities', coreCtrl.getCommunities);

module.exports = router;
