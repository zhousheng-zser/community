const express = require('express');
const router = express.Router();
const platformFeeService = require('../services/platformFee.service');

router.get('/fee-rates', async (req, res) => {
  try {
    const rates = await platformFeeService.getAllPlatformFeeRates();
    res.json({ errno: 0, data: rates });
  } catch (e) {
    console.error('[platform/fee-rates]', e);
    res.status(500).json({ errno: 500, errmsg: '加载失败' });
  }
});

module.exports = router;
