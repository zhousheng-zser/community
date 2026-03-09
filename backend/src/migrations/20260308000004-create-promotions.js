'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Promotions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            order_id: {
                type: Sequelize.INTEGER
            },
            promoter_id: {
                type: Sequelize.INTEGER
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2)
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'pending' // 'pending', 'settled'
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Promotions');
    }
};
