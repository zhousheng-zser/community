'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_follows', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, comment: '当前用户' },
      follow_user_id: { type: Sequelize.INTEGER, allowNull: false, comment: '被关注用户' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('user_follows', ['user_id']);
    await queryInterface.addIndex('user_follows', ['user_id', 'follow_user_id'], { unique: true });

    await queryInterface.createTable('activities', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT },
      start_time: { type: Sequelize.DATE },
      end_time: { type: Sequelize.DATE },
      status: { type: Sequelize.STRING(20), defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('activity_participants', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      activity_id: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('activity_participants', ['user_id']);

    await queryInterface.createTable('user_addresses', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(50), allowNull: false, comment: '收货人' },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      province: { type: Sequelize.STRING(50) },
      city: { type: Sequelize.STRING(50) },
      district: { type: Sequelize.STRING(50) },
      detail: { type: Sequelize.STRING(255), allowNull: false, comment: '详细地址' },
      is_default: { type: Sequelize.TINYINT, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('user_addresses', ['user_id']);

    await queryInterface.createTable('feedback', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      contact: { type: Sequelize.STRING(100) },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('feedback', ['user_id']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('user_follows');
    await queryInterface.dropTable('activity_participants');
    await queryInterface.dropTable('activities');
    await queryInterface.dropTable('user_addresses');
    await queryInterface.dropTable('feedback');
  }
};
