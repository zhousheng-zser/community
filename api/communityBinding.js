/**
 * 用户小区绑定（最多 3 个 + 当前选用）
 */
const { get, post, patch, del } = require('../utils/util.js');

const BASE = '/user/community-bindings';

const getCommunityBindings = () => get(BASE);

const bindUserCommunity = (communityId) =>
  post(BASE, { community_id: communityId });

const unbindUserCommunity = (communityId) =>
  del(`${BASE}/${communityId}`);

const setActiveUserCommunity = (communityId) =>
  patch(`${BASE}/active`, { community_id: communityId });

module.exports = {
  getCommunityBindings,
  bindUserCommunity,
  unbindUserCommunity,
  setActiveUserCommunity
};
