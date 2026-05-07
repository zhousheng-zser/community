/**
 * 环境配置
 * 用于区分开发/测试/生产环境，控制演示入口和mock数据
 */

const ENV = {
  DEVELOPMENT: 'development',
  TESTING: 'testing',
  PRODUCTION: 'production'
};

let _currentEnv = ENV.DEVELOPMENT;

function init() {
  try {
    const saved = wx.getStorageSync('app_env');
    if (saved && Object.values(ENV).includes(saved)) {
      _currentEnv = saved;
    }
  } catch (e) { }
  return _currentEnv;
}

function getCurrentEnv() {
  if (!_currentEnv) init();
  return _currentEnv;
}

function setEnv(env) {
  if (Object.values(ENV).includes(env)) {
    _currentEnv = env;
    try {
      wx.setStorageSync('app_env', env);
    } catch (e) { }
  }
}

function isDevelopment() {
  return getCurrentEnv() === ENV.DEVELOPMENT;
}

function isTesting() {
  return getCurrentEnv() === ENV.TESTING;
}

function isProduction() {
  return getCurrentEnv() === ENV.PRODUCTION;
}

/** 是否允许显示演示/测试入口 */
function shouldShowDemoEntries() {
  return isDevelopment() || isTesting();
}

/** 是否允许使用mock数据 */
function shouldUseMockData() {
  return isDevelopment();
}

/** 获取API基础URL */
function getApiBaseUrl() {
  switch (getCurrentEnv()) {
    case ENV.PRODUCTION:
      return 'https://api.yourdomain.com';
    case ENV.TESTING:
      return 'https://test-api.yourdomain.com';
    default:
      return 'https://8.136.29.208:3001';
  }
}

module.exports = {
  ENV,
  init,
  getCurrentEnv,
  setEnv,
  isDevelopment,
  isTesting,
  isProduction,
  shouldShowDemoEntries,
  shouldUseMockData,
  getApiBaseUrl
};
