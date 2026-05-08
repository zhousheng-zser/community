'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MarketRefundOrder extends Model {
    static associate() {}
  }
  MarketRefundOrder.init({
    refund_no: { type: DataTypes.STRING(40), allowNull: false },
    order_no: { type: DataTypes.STRING(40), allowNull: false },
    out_trade_no: DataTypes.STRING(64),
    reason: DataTypes.STRING(255),
    refund_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'processing', 'success', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    audit_note: DataTypes.STRING(255),
    executed_at: DataTypes.DATE,
    reviewed_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'MarketRefundOrder',
    tableName: 'market_refund_orders',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return MarketRefundOrder;
};
