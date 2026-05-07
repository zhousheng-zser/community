'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CouponTemplate extends Model {
    static associate() {}
  }
  CouponTemplate.init({
    name: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.ENUM('full_minus', 'discount', 'cash'), allowNull: false, defaultValue: 'cash' },
    threshold_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    total_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    issued_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    valid_from: DataTypes.DATE,
    valid_to: DataTypes.DATE,
    status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
    service_provider_id: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    sequelize,
    modelName: 'CouponTemplate',
    tableName: 'coupon_templates',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return CouponTemplate;
};
