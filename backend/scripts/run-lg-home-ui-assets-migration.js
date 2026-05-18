/**
 * 本地商城首页运营图表：未存在则执行迁移（可重复执行）
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { sequelize } = require('../src/models');
const Sequelize = require('sequelize');
const migration = require('../src/migrations/20260518120000-create-lg-home-ui-assets.js');

(async () => {
  try {
    const qi = sequelize.getQueryInterface();
    const tables = (await qi.showAllTables()).map((t) => String(t).toLowerCase());
    const name = 'lg_home_ui_assets';
    if (tables.includes(name)) {
      console.log(`${name} already exists, skip.`);
    } else {
      await migration.up(qi, Sequelize);
      console.log(`Migration applied: ${name}`);
    }
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
