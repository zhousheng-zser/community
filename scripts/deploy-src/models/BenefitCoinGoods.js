'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BenefitCoinGoods extends Model {
    static associate(models) {
      BenefitCoinGoods.hasMany(models.BenefitCoinExchange, { foreignKey: 'goods_id', as: 'exchanges' });
    }
  }
  BenefitCoinGoods.init({
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT },
    image_url: { type: DataTypes.STRING(500), defaultValue: '' },
    images: { type: DataTypes.JSON },
    coins: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    sold_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'BenefitCoinGoods',
    tableName: 'benefit_coin_goods',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return BenefitCoinGoods;
};
