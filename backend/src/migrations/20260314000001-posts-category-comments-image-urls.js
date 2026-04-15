'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Posts');
    if (!tableInfo.category) {
      await queryInterface.addColumn('Posts', 'category', {
        type: Sequelize.STRING(50),
        defaultValue: '邻里互动',
        comment: '帖子所归属的主题分类'
      });
    }
    const commentInfo = await queryInterface.describeTable('Comments');
    if (!commentInfo.image_urls) {
      await queryInterface.addColumn('Comments', 'image_urls', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '评论所附带的图片数组(至多3张)'
      });
    }
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('Posts', 'category');
    await queryInterface.removeColumn('Comments', 'image_urls');
  }
};
