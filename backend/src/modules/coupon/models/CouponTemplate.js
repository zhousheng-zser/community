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
    },
    issue_mode: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'claim'
    },
    per_user_limit: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1
    },
    receive_from: { type: DataTypes.DATE, allowNull: true },
    receive_to: { type: DataTypes.DATE, allowNull: true },
    apply_scope: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'all'
    },
    show_on_home: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    home_sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: ''
    },
    is_new_user: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
