'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Feeds', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            title: {
                type: Sequelize.STRING
            },
            author_id: {
                type: Sequelize.INTEGER
            },
            likes_count: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            media_type: {
                type: Sequelize.STRING
            },
            media_url: {
                type: Sequelize.STRING
            },
            related_goods_id: {
                type: Sequelize.INTEGER
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
        await queryInterface.dropTable('Feeds');
    }
};
