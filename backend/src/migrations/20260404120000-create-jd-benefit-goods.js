'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jd_benefit_goods', {
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
      sku_id: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      image_url: {
        type: Sequelize.STRING(512),
        allowNull: false
      },
      spread_url: {
        type: Sequelize.STRING(1024),
        allowNull: false
      },
      price: { type: Sequelize.STRING(32), allowNull: true },
      rebate_amount: { type: Sequelize.STRING(32), allowNull: true },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1
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
    await queryInterface.addIndex('jd_benefit_goods', ['scene', 'sort_order'], {
      name: 'idx_jd_benefit_scene_sort'
    });
    await queryInterface.addIndex('jd_benefit_goods', ['sku_id', 'scene'], {
      unique: true,
      name: 'uk_jd_benefit_sku_scene'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('jd_benefit_goods');
  }
};
