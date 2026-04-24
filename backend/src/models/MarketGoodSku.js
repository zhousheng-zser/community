'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MarketGoodSku extends Model {
    static associate(models) {
      MarketGoodSku.belongsTo(models.MarketGood, { foreignKey: 'goods_id', as: 'good' });
    }
  }
  MarketGoodSku.init(
    {
      goods_id: { type: DataTypes.INTEGER, allowNull: false },
      sku_code: { type: DataTypes.STRING(64), allowNull: true },
      specs: { type: DataTypes.JSON, allowNull: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      image: { type: DataTypes.STRING(512), allowNull: true },
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' }
    },
    {
      sequelize,
      modelName: 'MarketGoodSku',
      tableName: 'market_good_skus',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );
  return MarketGoodSku;
};
