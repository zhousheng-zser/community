'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_provider_portal_accounts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      profile_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        comment: 'service_provider_profiles.id'
      },
      username: {
        type: Sequelize.STRING(80),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('owner', 'operator'),
        allowNull: false,
        defaultValue: 'owner'
      },
      status: {
        type: Sequelize.ENUM('active', 'disabled'),
        allowNull: false,
        defaultValue: 'active'
      },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
    await queryInterface.addIndex('service_provider_portal_accounts', ['username'], {
      unique: true,
      name: 'uk_sp_portal_accounts_username'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('service_provider_portal_accounts');
  }
};
