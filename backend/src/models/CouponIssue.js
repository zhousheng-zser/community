'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CouponIssue extends Model {
    static associate(models) {
      this.belongsTo(models.CouponTemplate, { foreignKey: 'template_id', as: 'CouponTemplate' });
    }
  }
  CouponIssue.init({
    template_id: { type: DataTypes.BIGINT, allowNull: false },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    code: { type: DataTypes.STRING(64), allowNull: false },
    status: { type: DataTypes.ENUM('unused', 'used', 'expired'), allowNull: false, defaultValue: 'unused' },
    issued_at: DataTypes.DATE,
    used_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'CouponIssue',
    tableName: 'coupon_issues',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return CouponIssue;
};
