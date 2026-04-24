'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MarketOrderItem extends Model {
    static associate(models) {}
  }
  MarketOrderItem.init({
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    order_no: { type: DataTypes.STRING(40), allowNull: false },
    shop_id: { type: DataTypes.INTEGER, allowNull: false },
    goods_id: { type: DataTypes.INTEGER, allowNull: false },
    goods_name_snapshot: { type: DataTypes.STRING(150), allowNull: false },
    goods_image_snapshot: DataTypes.STRING(255),
    unit_price_snapshot: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    market_sku_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    specs_snapshot: { type: DataTypes.JSON, allowNull: true }
  }, {
    sequelize,
    modelName: 'MarketOrderItem',
    tableName: 'market_order_items',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['order_id'], name: 'idx_order_id' },
      { fields: ['order_no'], name: 'idx_order_no' }
    ]
  });
  return MarketOrderItem;
};
