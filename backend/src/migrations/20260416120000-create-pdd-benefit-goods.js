'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pdd_benefit_goods', {
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
      link_key: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      goods_id: {
        type: Sequelize.STRING(64),
        allowNull: true
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
      mini_path: { type: Sequelize.STRING(512), allowNull: true },
      price: { type: Sequelize.STRING(32), allowNull: true },
      coupon_price: { type: Sequelize.STRING(32), allowNull: true },
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
    await queryInterface.addIndex('pdd_benefit_goods', ['scene', 'sort_order'], {
      name: 'idx_pdd_benefit_scene_sort'
    });
    await queryInterface.addIndex('pdd_benefit_goods', ['link_key', 'scene'], {
      unique: true,
      name: 'uk_pdd_benefit_link_scene'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pdd_benefit_goods');
  }
};
