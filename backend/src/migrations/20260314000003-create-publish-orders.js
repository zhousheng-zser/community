'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('publish_orders', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, comment: '发单人ID' },
      category: { type: Sequelize.STRING(50), allowNull: false, comment: '需求类别' },
      address: { type: Sequelize.STRING(255), allowNull: false, comment: '服务发生地址/上门地址' },
      expected_time: { type: Sequelize.DATE, allowNull: true, comment: '期望执行时间' },
      content: { type: Sequelize.TEXT, allowNull: false, comment: '具体文字需求说明' },
      images: { type: Sequelize.JSON, allowNull: true, comment: '上传附件多图URL' },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'completed', 'cancelled'),
        defaultValue: 'pending',
        comment: '订单流转状态'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
    await queryInterface.addIndex('publish_orders', ['status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('publish_orders');
  }
};
