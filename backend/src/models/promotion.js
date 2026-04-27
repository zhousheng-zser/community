'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Promotion extends Model {
        static associate(models) {
            Promotion.belongsTo(models.User, { foreignKey: 'promoter_id', as: 'promoter' });
        }
    }
    Promotion.init({
        order_id: DataTypes.INTEGER,
        promoter_id: DataTypes.INTEGER,
        amount: DataTypes.DECIMAL(10, 2),
        status: DataTypes.STRING // 'pending', 'settled'
    }, {
    sequelize,
    modelName: 'Promotion',
    tableName: 'Promotions',
  });
    return Promotion;
};
