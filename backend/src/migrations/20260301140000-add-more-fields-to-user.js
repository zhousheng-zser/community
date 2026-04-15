'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            await queryInterface.addColumn('Users', 'address', {
                type: Sequelize.STRING,
                allowNull: true
            });
        } catch (e) { console.log('address exist'); }
        try {
            await queryInterface.addColumn('Users', 'bank_num', {
                type: Sequelize.STRING,
                allowNull: true
            });
        } catch (e) { console.log('bank_num exist'); }
        try {
            await queryInterface.addColumn('Users', 'wx_id', {
                type: Sequelize.STRING,
                allowNull: true
            });
        } catch (e) { console.log('wx_id exist'); }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Users', 'address');
        await queryInterface.removeColumn('Users', 'bank_num');
        await queryInterface.removeColumn('Users', 'wx_id');
    }
};
