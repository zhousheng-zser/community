'use strict';

module.exports = (sequelize, DataTypes) => {
  const CouponIssue = sequelize.define('CouponIssue', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    template_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: ''
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'unused'
    },
    issued_at: { type: DataTypes.DATE, allowNull: true },
    used_at: { type: DataTypes.DATE, allowNull: true },
    order_type: { type: DataTypes.STRING(32), allowNull: true },
    order_ref: { type: DataTypes.STRING(64), allowNull: true }
  }, {
    tableName: 'coupon_issues',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  CouponIssue.associate = (models) => {
    CouponIssue.belongsTo(models.CouponTemplate, {
      foreignKey: 'template_id',
      as: 'CouponTemplate'
    });
  };

  return CouponIssue;
};
