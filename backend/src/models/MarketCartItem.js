'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MarketCartItem extends Model {
    static associate(models) {}
  }
  MarketCartItem.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    shop_id: { type: DataTypes.INTEGER, allowNull: false },
    goods_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    checked: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
  }, {
    sequelize,
    modelName: 'MarketCartItem',
    tableName: 'market_cart_items',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['user_id', 'shop_id', 'goods_id'], name: 'uk_user_shop_goods' },
      { fields: ['user_id', 'shop_id'], name: 'idx_user_shop' }
    ]
  });
  return MarketCartItem;
};
