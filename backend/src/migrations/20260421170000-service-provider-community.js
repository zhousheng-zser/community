'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('service_provider_profiles', 'community_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    } catch (e) {
      if (!String(e.message).includes('Duplicate')) console.warn('skip service_provider_profiles.community_id:', e.message);
    }
    try {
      await queryInterface.addIndex('service_provider_profiles', ['community_id', 'status'], {
        name: 'idx_spp_comm_status'
      });
    } catch (e) { /* ignore */ }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeColumn('service_provider_profiles', 'community_id');
    } catch (e) { /* ignore */ }
  }
};
