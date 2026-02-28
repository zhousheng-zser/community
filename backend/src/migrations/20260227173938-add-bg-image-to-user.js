'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'bg_image', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: '用户社区朋友圈背景图'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'bg_image');
  }
};
