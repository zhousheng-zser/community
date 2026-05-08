'use strict';

module.exports = (sequelize, DataTypes) => {
  const MarketOrderItem = sequelize.define('MarketOrderItem', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    order_no: { type: DataTypes.STRING(40), allowNull: false },
    shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    goods_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    goods_name_snapshot: { type: DataTypes.STRING(200), allowNull: false },
    goods_image_snapshot: { type: DataTypes.STRING(500), allowNull: true },
    unit_price_snapshot: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }
  }, {
    tableName: 'market_order_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return MarketOrderItem;
};
