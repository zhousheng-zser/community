'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Users', 'role', {
            type: Sequelize.STRING,
            defaultValue: 'user'
        });
        await queryInterface.addColumn('Users', 'balance', {
            type: Sequelize.DECIMAL(10, 2),
            defaultValue: 0.00
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Users', 'role');
        await queryInterface.removeColumn('Users', 'balance');
    }
};
