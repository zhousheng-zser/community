require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { sequelize } = require('../src/models');
const migration = require('../src/migrations/20260421170000-service-provider-community.js');

(async () => {
  try {
    await migration.up(sequelize.getQueryInterface(), require('sequelize'));
    console.log('service_provider_profiles.community_id migration OK.');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
