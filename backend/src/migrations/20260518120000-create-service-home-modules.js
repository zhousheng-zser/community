'use strict';

/** 小程序首页服务模块：group_key 与 Categories.group_type / 小程序路由一致 */

const LEGACY_MODULES = [
  ['tidy', '整理收纳', '份', 10],
  ['urgent_fix', '家修急事', '次', 20],
  ['appliance_clean', '家电清洗', '次', 30],
  ['pioneer_clean', '开荒保洁', '次', 40],
  ['mite_remove', '除螨服务', '次', 50],
  ['furniture_care', '家具养护', '次', 60],
  ['baby_home', '宝宝家事', '次', 70],
  ['house_repair', '房屋修缮', '次', 80],
  ['beauty_home', '上门美业', '次', 90]
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable('service_home_modules', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        group_key: { type: Sequelize.STRING(64), allowNull: false, unique: true },
        title: { type: Sequelize.STRING(100), allowNull: false },
        price_unit: { type: Sequelize.STRING(20), allowNull: false, defaultValue: '次' },
        icon_url: { type: Sequelize.STRING(512), allowNull: true },
        sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        is_active: { type: Sequelize.TINYINT, allowNull: false, defaultValue: 1 },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false }
      });
    } catch (e) {
      if (!String(e.message).includes('already exists')) throw e;
    }

    const rows = await queryInterface.sequelize.query(
      'SELECT COUNT(*) AS c FROM service_home_modules',
      { type: Sequelize.QueryTypes.SELECT }
    );
    const c = rows && rows[0] ? Number(rows[0].c) : 0;
    if (c > 0) return;

    const now = new Date();
    await queryInterface.bulkInsert(
      'service_home_modules',
      LEGACY_MODULES.map((row) => {
        const [group_key, title, price_unit, sort_order] = row;
        return {
          group_key,
          title,
          price_unit,
          icon_url: null,
          sort_order,
          is_active: 1,
          createdAt: now,
          updatedAt: now
        };
      })
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('service_home_modules').catch(() => {});
  }
};
