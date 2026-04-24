/**
 * 创建 service_provider_portal_accounts 表（服务商运行中台登录）
 * 用法：cd backend && node scripts/run-service-provider-portal-accounts-migration.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { sequelize } = require('../src/models');
const migration = require('../src/migrations/20260421190000-create-service-provider-portal-accounts.js');

(async () => {
  try {
    const qi = sequelize.getQueryInterface();
    const Sequelize = require('sequelize');
    const [rows] = await sequelize.query(
      "SHOW TABLES LIKE 'service_provider_portal_accounts'"
    );
    if (rows && rows.length > 0) {
      console.log('表 service_provider_portal_accounts 已存在，跳过。');
    } else {
      await migration.up(qi, Sequelize);
      console.log('迁移成功：service_provider_portal_accounts');
    }
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
