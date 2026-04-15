'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MarketOrder extends Model {
    static associate(models) {
      MarketOrder.belongsTo(models.User, { foreignKey: 'user_id', as: 'buyer' });
      MarketOrder.belongsTo(models.MarketShop, { foreignKey: 'shop_id', as: 'shop' });
    }
  }
  MarketOrder.init({
    order_no: { type: DataTypes.STRING(40), allowNull: false },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    shop_id: { type: DataTypes.BIGINT, allowNull: false },
    order_status: {
      type: DataTypes.ENUM('pending_payment', 'paid', 'delivering', 'completed', 'cancelled', 'closed'),
      allowNull: false,
      defaultValue: 'pending_payment'
    },
    pay_status: {
      type: DataTypes.ENUM('unpaid', 'paid', 'refund_pending', 'refunded', 'pay_failed'),
      allowNull: false,
      defaultValue: 'unpaid'
    },
    goods_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
    delivery_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
    payable_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
    receiver_name: DataTypes.STRING(50),
    receiver_phone: DataTypes.STRING(30),
    receiver_address: DataTypes.STRING(255),
    remark: DataTypes.STRING(255),
    cancel_reason: DataTypes.STRING(100),
    paid_at: DataTypes.DATE,
    cancelled_at: DataTypes.DATE,
    expired_at: DataTypes.DATE,
    community_id: { type: DataTypes.BIGINT, allowNull: true }
  }, {
    sequelize,
    modelName: 'MarketOrder',
    tableName: 'market_orders',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['order_no'], name: 'uk_order_no' },
      { fields: ['user_id', 'created_at'], name: 'idx_user_ctime' },
      { fields: ['shop_id', 'created_at'], name: 'idx_shop_ctime' },
      { fields: ['order_status', 'pay_status'], name: 'idx_status' }
    ]
  });
  return MarketOrder;
};
