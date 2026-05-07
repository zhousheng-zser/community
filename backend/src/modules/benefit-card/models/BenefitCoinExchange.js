'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BenefitCoinExchange extends Model {
    static associate(models) {
      BenefitCoinExchange.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      BenefitCoinExchange.belongsTo(models.BenefitCoinGoods, { foreignKey: 'goods_id', as: 'goods' });
    }
  }
  BenefitCoinExchange.init({
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    goods_id: { type: DataTypes.BIGINT, allowNull: false },
    goods_name: { type: DataTypes.STRING(200), defaultValue: '' },
    coins_spent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    status: { type: DataTypes.ENUM('pending', 'completed', 'cancelled'), defaultValue: 'pending' }
  }, {
    sequelize,
    modelName: 'BenefitCoinExchange',
    tableName: 'benefit_coin_exchanges',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return BenefitCoinExchange;
};
