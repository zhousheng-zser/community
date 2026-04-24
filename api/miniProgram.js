/**
 * 第三方小程序模块 API
 */
const { get, post, put, del } = require('../utils/util.js');

/**
 * 获取第三方小程序列表
 * GET /mini-programs
 */
const getMiniPrograms = () => {
  return get('/mini-programs');
};

/**
 * 获取第三方小程序详情
 * GET /mini-programs/:id
 */
const getMiniProgramDetail = (id) => {
  return get(`/mini-programs/${id}`);
};

/**
 * 创建第三方小程序配置（管理员）
 * POST /mini-programs
 */
const createMiniProgram = (data) => {
  return post('/mini-programs', data);
};

/**
 * 更新第三方小程序配置（管理员）
 * PUT /mini-programs/:id
 */
const updateMiniProgram = (id, data) => {
  return put(`/mini-programs/${id}`, data);
};

/**
 * 删除第三方小程序配置（管理员）
 * DELETE /mini-programs/:id
 */
const deleteMiniProgram = (id) => {
  return del(`/mini-programs/${id}`);
};

module.exports = {
  getMiniPrograms,
  getMiniProgramDetail,
  createMiniProgram,
  updateMiniProgram,
  deleteMiniProgram
};
