require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { sequelize } = require('../src/models');
const migration = require('../src/migrations/20260422120000-market-o2o-sku-order-status.js');

(async () => {
  try {
    await migration.up(sequelize.getQueryInterface(), require('sequelize'));
    console.log('Market O2O migration OK (SKUs, order_status, applications).');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
