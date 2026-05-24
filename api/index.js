/**
 * API 统一入口
 * 按模块导出所有API接口
 */
const auth = require('./auth.js');
const user = require('./user.js');
const core = require('./core.js');
const order = require('./order.js');
const serviceOrder = require('./serviceOrder.js');
const neighborAssist = require('./neighborAssist.js');
const market = require('./market.js');
const serviceCart = require('./serviceCart.js');
const worker = require('./worker.js');
const serviceProvider = require('./serviceProvider.js');
const merchant = require('./merchant.js');
const message = require('./message.js');
const coupon = require('./coupon.js');
const benefitCoin = require('./benefitCoin.js');
const promoter = require('./promoter.js');
const commission = require('./commission.js');
const partner = require('./partner.js');
const chat = require('./chat.js');
const chatOrder = require('./chat-order.js');
const miniProgram = require('./miniProgram.js');
const communityBinding = require('./communityBinding.js');

module.exports = {
  auth,
  user,
  core,
  communityBinding,
  order,
  serviceOrder,
  neighborAssist,
  market,
  serviceCart,
  worker,
  serviceProvider,
  merchant,
  message,
  coupon,
  benefitCoin,
  promoter,
  commission,
  partner,
  chat,
  chatOrder,
  miniProgram
};
