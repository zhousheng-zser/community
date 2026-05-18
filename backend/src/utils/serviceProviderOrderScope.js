const { Op } = require('sequelize');
const { ServiceProviderProfile, Service, ServiceOrder, User } = require('../models');

async function loadActiveProviderProfile(userId) {
  return ServiceProviderProfile.findOne({ where: { user_id: userId, status: 'active' } });
}

async function getServiceIdsForProfile(profileId) {
  const rows = await Service.findAll({ where: { provider_id: profileId }, attributes: ['id'] });
  return rows.map((r) => r.id);
}

/** 服务商在 C 端可管理的订单范围：直挂 provider_user_id 或订单所属服务归属本店铺（Service.provider_id = profile.id） */
function buildProviderOrderWhereClause(profile, serviceIds) {
  const or = [{ provider_user_id: profile.user_id }];
  if (serviceIds.length) {
    or.push({ service_id: { [Op.in]: serviceIds } });
  }
  return { [Op.or]: or };
}

function providerOrderInclude() {
  return [
    { model: Service, as: 'service', attributes: ['id', 'title', 'cover_image', 'price', 'description', 'provider_id'] },
    { model: User, as: 'buyer', attributes: ['id', 'nickname', 'phone'] },
    { model: User, as: 'assignedWorker', attributes: ['id', 'nickname', 'avatar_url', 'phone'], required: false }
  ];
}

/**
 * 单笔订单是否属于该服务商（与小程序 /service-provider/orders 一致）
 */
async function findProviderOrderById(orderId, profile, serviceIds) {
  const order = await ServiceOrder.findOne({
    where: { id: orderId },
    include: providerOrderInclude()
  });
  if (!order) return null;
  const plain = order.get({ plain: true });
  if (plain.provider_user_id === profile.user_id) return order;
  if (plain.service_id && serviceIds.includes(plain.service_id)) return order;
  return null;
}

async function resolveProviderContext(userId) {
  const profile = await loadActiveProviderProfile(userId);
  if (!profile) return null;
  const serviceIds = await getServiceIdsForProfile(profile.id);
  return { profile, serviceIds };
}

module.exports = {
  loadActiveProviderProfile,
  getServiceIdsForProfile,
  buildProviderOrderWhereClause,
  providerOrderInclude,
  findProviderOrderById,
  resolveProviderContext
};
