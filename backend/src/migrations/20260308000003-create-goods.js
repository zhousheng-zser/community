'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Goods', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            title: {
                type: Sequelize.STRING
            },
            price: {
                type: Sequelize.DECIMAL(10, 2)
            },
            commission: {
                type: Sequelize.DECIMAL(10, 2)
            },
            cover_image: {
                type: Sequelize.STRING
            },
            detail_images: {
                type: Sequelize.JSON
            },
            stock: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            tab_category: {
                type: Sequelize.STRING
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
        await queryInterface.dropTable('Goods');
    }
};
