'use strict';

module.exports = (sequelize, DataTypes) => {
  const MarketOrder = sequelize.define('MarketOrder', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    order_no: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    order_status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending_payment' },
    pay_status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'unpaid' },
    delivery_mode: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'express' },
    goods_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    delivery_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    payable_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    receiver_name: { type: DataTypes.STRING(50), allowNull: true },
    receiver_phone: { type: DataTypes.STRING(30), allowNull: true },
    receiver_address: { type: DataTypes.STRING(255), allowNull: true },
    remark: { type: DataTypes.STRING(255), allowNull: true },
    cancel_reason: { type: DataTypes.STRING(255), allowNull: true },
    paid_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    delivered_at: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    expired_at: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'market_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return MarketOrder;
};
