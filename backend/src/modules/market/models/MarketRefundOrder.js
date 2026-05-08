'use strict';

module.exports = (sequelize, DataTypes) => {
  const MarketRefundOrder = sequelize.define('MarketRefundOrder', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    order_no: { type: DataTypes.STRING(40), allowNull: false },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    decided_at: { type: DataTypes.DATE, allowNull: true },
    decided_by: { type: DataTypes.STRING(64), allowNull: true }
  }, {
    tableName: 'market_refund_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return MarketRefundOrder;
};
