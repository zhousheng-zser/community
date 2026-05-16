'use strict';

/** 新环境建表参考：Users.id 为雪花 BIGINT，非自增。已有库请执行 npm run migrate:users-snowflake */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [cols] = await queryInterface.sequelize.query(
      `SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'users' AND COLUMN_NAME = 'id'`
    );
    if (cols[0] && cols[0].DATA_TYPE === 'bigint') return;
    throw new Error('请先运行: npm run migrate:users-snowflake');
  },
  async down() {
    throw new Error('不支持回滚雪花 ID 迁移');
  }
};
