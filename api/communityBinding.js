/**
 * 用户小区绑定（最多 3 个 + 当前选用）
 */
// 运行时调用 util.*，避免 util ↔ boundCommunityLocation ↔ communityBind 循环依赖时 patch/del 未初始化
const util = require('../utils/util.js');

const BASE = '/user/community-bindings';

const getCommunityBindings = () => util.get(BASE);

const bindUserCommunity = (communityId) =>
  util.post(BASE, { community_id: communityId });

const unbindUserCommunity = (communityId) =>
  util.del(`${BASE}/${communityId}`);

const setActiveUserCommunity = (communityId) =>
  util.patch(`${BASE}/active`, { community_id: communityId });

module.exports = {
  getCommunityBindings,
  bindUserCommunity,
  unbindUserCommunity,
  setActiveUserCommunity
};
