'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Shops', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING
            },
            logo_url: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.STRING
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'open'
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

        await queryInterface.createTable('LiveStreams', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            shop_id: {
                type: Sequelize.INTEGER
            },
            title: {
                type: Sequelize.STRING
            },
            cover_url: {
                type: Sequelize.STRING
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: 'live'
            },
            viewers_count: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            max_rebate: {
                type: Sequelize.DECIMAL(10, 2)
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

        // 为现有的 Goods 表追加 shop_id 关联
        await queryInterface.addColumn('Goods', 'shop_id', {
            type: Sequelize.INTEGER
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('LiveStreams');
        await queryInterface.dropTable('Shops');
        await queryInterface.removeColumn('Goods', 'shop_id');
    }
};
