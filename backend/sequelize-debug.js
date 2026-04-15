require('dotenv').config();
const { sequelize } = require('./src/models');

async function fixSchema() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('Users');

        if (!tableInfo.address) {
            console.log('Adding address column...');
            await queryInterface.addColumn('Users', 'address', {
                type: require('sequelize').DataTypes.STRING,
                allowNull: true
            });
        }

        if (!tableInfo.bank_num) {
            console.log('Adding bank_num column...');
            await queryInterface.addColumn('Users', 'bank_num', {
                type: require('sequelize').DataTypes.STRING,
                allowNull: true
            });
        }

        if (!tableInfo.wx_id) {
            console.log('Adding wx_id column...');
            await queryInterface.addColumn('Users', 'wx_id', {
                type: require('sequelize').DataTypes.STRING,
                allowNull: true
            });
        }

        console.log('Schema fix completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing schema:', error);
        process.exit(1);
    }
}

fixSchema();
