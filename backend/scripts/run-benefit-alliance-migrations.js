/**
 * 惠民卡三张表：未存在则执行迁移（可重复执行）
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { sequelize } = require('../src/models');
const Sequelize = require('sequelize');
const jdM = require('../src/migrations/20260404120000-create-jd-benefit-goods.js');
const pddM = require('../src/migrations/20260416120000-create-pdd-benefit-goods.js');
const cfgM = require('../src/migrations/20260416120100-create-benefit-alliance-config.js');

(async () => {
  try {
    const qi = sequelize.getQueryInterface();
    const tables = (await qi.showAllTables()).map((t) => String(t).toLowerCase());

    async function run(name, migration) {
      if (tables.includes(name)) {
        console.log(`${name} already exists, skip.`);
        return;
      }
      await migration.up(qi, Sequelize);
      console.log(`Migration applied: ${name}`);
    }

    await run('jd_benefit_goods', jdM);
    await run('pdd_benefit_goods', pddM);
    await run('benefit_alliance_config', cfgM);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
