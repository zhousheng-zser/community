/**
 * 为首个 active 的 service_provider_profile 创建演示门户账号（仅开发环境使用）
 * 用法：cd backend && node scripts/seed-service-provider-portal-demo-account.js
 * 默认：username=sp_demo  password=sp_demo123  profile=第一个 active 且尚无门户账号的档案
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const crypto = require('crypto');
const { ServiceProviderPortalAccount, ServiceProviderProfile, sequelize } = require('../src/models');

function hashPassword(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

(async () => {
  try {
    const username = process.env.SP_PORTAL_SEED_USERNAME || 'sp_demo';
    const password = process.env.SP_PORTAL_SEED_PASSWORD || 'sp_demo123';

    const existing = await ServiceProviderPortalAccount.findOne({ where: { username } });
    if (existing) {
      console.log('已存在用户名', username, '跳过。');
      await sequelize.close();
      return;
    }

    const prof = await ServiceProviderProfile.findOne({
      where: { status: 'active' },
      order: [['id', 'ASC']]
    });
    if (!prof) {
      console.error('无 active 的 service_provider_profiles，请先通过运营后台审核服务商入驻。');
      process.exitCode = 1;
      await sequelize.close();
      return;
    }

    const taken = await ServiceProviderPortalAccount.findOne({ where: { profile_id: prof.id } });
    if (taken) {
      console.log('profile_id', prof.id, '已有门户账号，跳过。');
      await sequelize.close();
      return;
    }

    await ServiceProviderPortalAccount.create({
      profile_id: prof.id,
      username,
      password_hash: hashPassword(password),
      status: 'active',
      role: 'owner'
    });
    console.log('已创建演示门户账号:', { username, password, profile_id: prof.id, shop_name: prof.shop_name });
    console.log('登录接口: POST /api/v1/service-provider-portal/login');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
