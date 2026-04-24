'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const add = async (table, col, spec) => {
      try {
        await queryInterface.addColumn(table, col, spec);
      } catch (e) {
        if (!String(e.message).includes('Duplicate')) console.warn(`skip ${table}.${col}:`, e.message);
      }
    };
    await add('service_orders', 'fulfillment_meta', { type: Sequelize.JSON, allowNull: true });
    await add('market_goods', 'safe_stock', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeColumn('service_orders', 'fulfillment_meta');
    } catch (_) { /* */ }
    try {
      await queryInterface.removeColumn('market_goods', 'safe_stock');
    } catch (_) { /* */ }
  }
};
