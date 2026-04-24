'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('benefit_alliance_config', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED
      },
      scene: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'benefit_card'
      },
      platform: {
        type: Sequelize.STRING(8),
        allowNull: false
      },
      hero_image_url: {
        type: Sequelize.STRING(512),
        allowNull: false
      },
      hero_title: { type: Sequelize.STRING(255), allowNull: true },
      hero_subtitle: { type: Sequelize.STRING(255), allowNull: true },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.addIndex('benefit_alliance_config', ['scene', 'platform'], {
      unique: true,
      name: 'uk_benefit_alliance_scene_platform'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('benefit_alliance_config');
  }
};
