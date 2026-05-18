require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { sequelize } = require('../src/models');
const migration = require('../src/migrations/20260518120000-create-service-home-modules.js');

(async () => {
  try {
    await migration.up(sequelize.getQueryInterface(), require('sequelize'));
    console.log('service_home_modules migration OK.');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
