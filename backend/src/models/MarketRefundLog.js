'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MarketRefundLog extends Model {
    static associate() {}
  }
  MarketRefundLog.init({
    refund_no: { type: DataTypes.STRING(40), allowNull: false },
    from_status: DataTypes.STRING(30),
    to_status: { type: DataTypes.STRING(30), allowNull: false },
    note: DataTypes.STRING(255),
    operator: DataTypes.STRING(100)
  }, {
    sequelize,
    modelName: 'MarketRefundLog',
    tableName: 'market_refund_logs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return MarketRefundLog;
};
