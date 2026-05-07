'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MarketPayTransaction extends Model {
    static associate(models) {}
  }
  MarketPayTransaction.init({
    order_no: { type: DataTypes.STRING(40), allowNull: false },
    out_trade_no: { type: DataTypes.STRING(64), allowNull: false },
    channel: {
      type: DataTypes.ENUM('wechat_jsapi'),
      allowNull: false,
      defaultValue: 'wechat_jsapi'
    },
    transaction_id: DataTypes.STRING(64),
    pay_status: {
      type: DataTypes.ENUM('created', 'success', 'failed', 'closed', 'refunded'),
      allowNull: false,
      defaultValue: 'created'
    },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    notify_raw: DataTypes.JSON,
    notify_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    last_notify_at: DataTypes.DATE,
    paid_at: DataTypes.DATE,
    order_type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'market' }
  }, {
    sequelize,
    modelName: 'MarketPayTransaction',
    tableName: 'market_pay_transactions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['out_trade_no'], name: 'uk_out_trade_no' },
      { fields: ['order_no'], name: 'idx_order_no' },
      { fields: ['pay_status'], name: 'idx_status' }
    ]
  });
  return MarketPayTransaction;
};
