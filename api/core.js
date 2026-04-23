/**
 * 核心数据模块 API
 * 对应后端文档：三、核心数据模块
 */
const { get } = require('../util.js');

/**
 * 获取轮播图
 * GET /core/banners
 */
const getBanners = () => {
  return get('/core/banners');
};

/**
 * 获取服务分类
 * GET /core/categories
 */
const getCategories = () => {
  return get('/core/categories');
};

/**
 * 获取热门服务
 * GET /core/hot-services
 */
const getHotServices = () => {
  return get('/core/hot-services');
};

/**
 * 获取服务列表
 * GET /core/services
 */
const getServiceList = (params) => {
  return get('/core/services', params);
};

/**
 * 获取服务详情
 * GET /core/services/:id
 */
const getServiceDetail = (id) => {
  return get(`/core/services/${id}`);
};

/**
 * 获取技工列表
 * GET /core/workers
 */
const getWorkerList = (params) => {
  return get('/core/workers', params);
};

/**
 * 获取技工详情
 * GET /core/workers/:id
 */
const getWorkerDetail = (id) => {
  return get(`/core/workers/${id}`);
};

/**
 * 获取服务商列表
 * GET /core/service-providers
 */
const getServiceProviderList = (params) => {
  return get('/core/service-providers', params);
};

module.exports = {
  getBanners,
  getCategories,
  getHotServices,
  getServiceList,
  getServiceDetail,
  getWorkerList,
  getWorkerDetail,
  getServiceProviderList
};
