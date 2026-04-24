'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const addCol = async (table, column, spec) => {
      try {
        await queryInterface.addColumn(table, column, spec);
      } catch (e) {
        if (!String(e.message).includes('Duplicate')) console.warn(`skip add ${table}.${column}:`, e.message);
      }
    };

    await addCol('Users', 'token_version', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'JWT token version; increment on logout to invalidate old tokens'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'token_version').catch(() => {});
  }
};

