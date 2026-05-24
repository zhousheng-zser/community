const platformFeeService = require('../services/platformFee.service');

exports.getPlatformFeeConfig = async (req, res) => {
  try {
    const rates = await platformFeeService.getAllPlatformFeeRates();
    res.json({ code: 0, msg: 'ok', data: rates });
  } catch (e) {
    console.error('[admin/platform-fee-config/get]', e);
    res.status(500).json({ code: 1, msg: '加载失败' });
  }
};

exports.updatePlatformFeeConfig = async (req, res) => {
  try {
    const body = req.body || {};
    const rates = await platformFeeService.setPlatformFeeConfig({
      global: body.global,
      market: body.market,
      service: body.service,
      neighbor_assist: body.neighbor_assist
    });
    res.json({ code: 0, msg: '保存成功', data: rates });
  } catch (e) {
    console.error('[admin/platform-fee-config/put]', e);
    res.status(500).json({ code: 1, msg: e.message || '保存失败' });
  }
};
