'use strict';

module.exports = (sequelize, DataTypes) => {
  const MarketPayTransaction = sequelize.define(
    'MarketPayTransaction',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_no: { type: DataTypes.STRING(64), allowNull: false },
      out_trade_no: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      channel: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'wechat_jsapi' },
      pay_status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'created' },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      transaction_id: { type: DataTypes.STRING(64), allowNull: true },
      paid_at: { type: DataTypes.DATE, allowNull: true },
      notify_raw: { type: DataTypes.JSON, allowNull: true },
      notify_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      last_notify_at: { type: DataTypes.DATE, allowNull: true }
    },
    {
      tableName: 'market_pay_transactions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );
  return MarketPayTransaction;
};
