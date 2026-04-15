/**
 * 在未配置 sequelize-cli 的情况下执行 jd_benefit_goods 表迁移（可重复执行：表已存在则跳过）
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { sequelize } = require('../src/models');
const migration = require('../src/migrations/20260404120000-create-jd-benefit-goods.js');

(async () => {
    try {
        const qi = sequelize.getQueryInterface();
        const tables = await qi.showAllTables();
        const has = tables.some(t => String(t).toLowerCase() === 'jd_benefit_goods');
        if (has) {
            console.log('jd_benefit_goods already exists, skip.');
        } else {
            await migration.up(qi, require('sequelize'));
            console.log('Migration applied: jd_benefit_goods');
        }
    } catch (e) {
        console.error(e);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
})();
