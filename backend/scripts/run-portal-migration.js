require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { sequelize } = require('../src/models');
const migration = require('../src/migrations/20260420120000-portal-fulfillment-safe-stock.js');

(async () => {
  try {
    await migration.up(sequelize.getQueryInterface(), require('sequelize'));
    console.log('Portal migration OK (fulfillment_meta, safe_stock).');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
