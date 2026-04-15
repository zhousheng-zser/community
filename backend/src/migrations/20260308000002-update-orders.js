'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Orders', 'order_no', {
            type: Sequelize.STRING(32)
        });
        await queryInterface.addColumn('Orders', 'goods_id', {
            type: Sequelize.INTEGER
        });
        await queryInterface.addColumn('Orders', 'promoter_id', {
            type: Sequelize.INTEGER
        });
        // 修改原有的 total_amount
        await queryInterface.changeColumn('Orders', 'total_amount', {
            type: Sequelize.DECIMAL(10, 2)
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Orders', 'order_no');
        await queryInterface.removeColumn('Orders', 'goods_id');
        await queryInterface.removeColumn('Orders', 'promoter_id');
        await queryInterface.changeColumn('Orders', 'total_amount', {
            type: Sequelize.DECIMAL
        });
    }
};
