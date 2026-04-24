const util = require('./util.js');
const app = getApp();

const BALANCE_TYPES = {
  USER: 'user_balance',
  WORKER: 'worker_balance',
  MERCHANT: 'merchant_balance',
  SERVICE_PROVIDER: 'provider_balance',
  MARKET_MERCHANT: 'market_merchant_balance',
  BENEFIT_COIN: 'benefit_coin_balance'
};

function getBalance(type) {
  const user = app.globalData.user || {};
  const balanceMap = {
    [BALANCE_TYPES.USER]: user.balance || user.userBalance || 0,
    [BALANCE_TYPES.WORKER]: user.worker_balance || user.workerBalance || user.worker_income || 0,
    [BALANCE_TYPES.MERCHANT]: user.merchant_balance || user.merchantBalance || user.shop_balance || 0,
    [BALANCE_TYPES.SERVICE_PROVIDER]: user.provider_balance || user.providerBalance || user.service_provider_balance || 0,
    [BALANCE_TYPES.MARKET_MERCHANT]: user.market_merchant_balance || user.marketMerchantBalance || user.market_balance || 0,
    [BALANCE_TYPES.BENEFIT_COIN]: user.benefit_coin_balance || user.benefitCoinBalance || user.benefitCoin || 0
  };
  return parseFloat(balanceMap[type] || 0);
}

function formatBalance(amount, decimals) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  return num.toFixed(decimals || 2);
}

function getDisplayBalance(type, decimals) {
  const balance = getBalance(type);
  return formatBalance(balance, decimals);
}

async function fetchBalanceFromServer(type) {
  try {
    let endpoint;
    switch (type) {
      case BALANCE_TYPES.USER:
        endpoint = 'user/profile';
        break;
      case BALANCE_TYPES.WORKER:
        endpoint = 'worker/finance/balance';
        break;
      case BALANCE_TYPES.MERCHANT:
        endpoint = 'merchant/finance/balance';
        break;
      case BALANCE_TYPES.SERVICE_PROVIDER:
        endpoint = 'service-provider-portal/finance/balance';
        break;
      case BALANCE_TYPES.MARKET_MERCHANT:
        endpoint = 'market/merchant/balance';
        break;
      case BALANCE_TYPES.BENEFIT_COIN:
        endpoint = 'api/v1/benefit-coin/balance';
        break;
      default:
        throw new Error('未知的余额类型');
    }

    const res = await util.get(endpoint);
    const data = res && res.data !== undefined ? res.data : res;
    
    const balanceMap = {
      [BALANCE_TYPES.USER]: data.balance || data.userBalance || 0,
      [BALANCE_TYPES.WORKER]: data.worker_balance || data.workerBalance || data.balance || 0,
      [BALANCE_TYPES.MERCHANT]: data.merchant_balance || data.merchantBalance || data.shop_balance || data.balance || 0,
      [BALANCE_TYPES.SERVICE_PROVIDER]: data.provider_balance || data.providerBalance || data.service_provider_balance || data.balance || 0,
      [BALANCE_TYPES.MARKET_MERCHANT]: data.market_merchant_balance || data.marketMerchantBalance || data.market_balance || data.balance || 0,
      [BALANCE_TYPES.BENEFIT_COIN]: data.benefit_coin_balance || data.benefitCoinBalance || data.benefitCoin || data.balance || 0
    };

    const balance = parseFloat(balanceMap[type] || 0);
    
    const user = app.globalData.user || {};
    const fieldMap = {
      [BALANCE_TYPES.USER]: 'balance',
      [BALANCE_TYPES.WORKER]: 'worker_balance',
      [BALANCE_TYPES.MERCHANT]: 'merchant_balance',
      [BALANCE_TYPES.SERVICE_PROVIDER]: 'provider_balance',
      [BALANCE_TYPES.MARKET_MERCHANT]: 'market_merchant_balance',
      [BALANCE_TYPES.BENEFIT_COIN]: 'benefit_coin_balance'
    };
    user[fieldMap[type]] = balance;
    app.globalData.user = user;
    wx.setStorageSync('user', user);

    return balance;
  } catch (err) {
    console.error('获取余额失败:', err);
    return getBalance(type);
  }
}

function getBalanceLabel(type) {
  const labels = {
    [BALANCE_TYPES.USER]: '账户余额',
    [BALANCE_TYPES.WORKER]: '技工收入',
    [BALANCE_TYPES.MERCHANT]: '商家结算',
    [BALANCE_TYPES.SERVICE_PROVIDER]: '服务商结算',
    [BALANCE_TYPES.MARKET_MERCHANT]: '集市商家结算',
    [BALANCE_TYPES.BENEFIT_COIN]: '家事币'
  };
  return labels[type] || '余额';
}

function getWithdrawEndpoint(type) {
  const endpoints = {
    [BALANCE_TYPES.USER]: 'user/withdraw',
    [BALANCE_TYPES.WORKER]: 'worker/finance/withdraw',
    [BALANCE_TYPES.MERCHANT]: 'merchant/finance/withdraw',
    [BALANCE_TYPES.SERVICE_PROVIDER]: 'service-provider-portal/finance/withdraw',
    [BALANCE_TYPES.MARKET_MERCHANT]: 'market/merchant/withdraw',
    [BALANCE_TYPES.BENEFIT_COIN]: null
  };
  return endpoints[type] || null;
}

module.exports = {
  BALANCE_TYPES,
  getBalance,
  formatBalance,
  getDisplayBalance,
  fetchBalanceFromServer,
  getBalanceLabel,
  getWithdrawEndpoint
};
