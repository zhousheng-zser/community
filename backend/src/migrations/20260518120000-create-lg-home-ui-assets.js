'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lg_home_ui_assets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED
      },
      asset_key: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      label: {
        type: Sequelize.STRING(128),
        allowNull: false,
        defaultValue: ''
      },
      group_type: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'other'
      },
      image_url: {
        type: Sequelize.STRING(512),
        allowNull: false,
        defaultValue: ''
      },
      sort_order: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.addIndex('lg_home_ui_assets', ['asset_key'], {
      unique: true,
      name: 'uk_lg_home_ui_assets_key'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('lg_home_ui_assets');
  }
};
