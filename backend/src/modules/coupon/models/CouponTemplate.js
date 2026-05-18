'use strict';

module.exports = (sequelize, DataTypes) => {
  const CouponTemplate = sequelize.define('CouponTemplate', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: ''
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: ''
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'amount'
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    threshold_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    total_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    issued_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    valid_from: { type: DataTypes.DATE, allowNull: true },
    valid_to: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'coupon_templates',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  CouponTemplate.associate = (models) => {
    CouponTemplate.hasMany(models.CouponIssue, { foreignKey: 'template_id', as: 'issues' });
  };

  return CouponTemplate;
};
