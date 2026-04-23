/**
 * API 统一入口
 * 按模块导出所有API接口
 */
const auth = require('./auth.js');
const user = require('./user.js');
const core = require('./core.js');
const serviceOrder = require('./serviceOrder.js');
const neighborAssist = require('./neighborAssist.js');
const market = require('./market.js');
const worker = require('./worker.js');
const serviceProvider = require('./serviceProvider.js');
const merchant = require('./merchant.js');
const message = require('./message.js');

module.exports = {
  auth,
  user,
  core,
  serviceOrder,
  neighborAssist,
  market,
  worker,
  serviceProvider,
  merchant,
  message
};
