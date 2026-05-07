'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CommissionDistribution extends Model {
    static associate(models) {
      CommissionDistribution.belongsTo(models.User, { foreignKey: 'beneficiary_user_id', as: 'beneficiary' });
      CommissionDistribution.belongsTo(models.User, { foreignKey: 'promoter_user_id', as: 'promoter' });
    }
  }

  CommissionDistribution.init({
    order_id: { type: DataTypes.STRING(100), allowNull: false },
    order_type: { type: DataTypes.STRING(50), defaultValue: 'market' },
    order_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    commission_pool: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    beneficiary_user_id: { type: DataTypes.BIGINT, allowNull: true },
    beneficiary_role: {
      type: DataTypes.ENUM('headquarters', 'promoter', 'district_partner', 'market_partner'),
      allowNull: false
    },
    role_percentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    commission_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    status: { type: DataTypes.ENUM('pending', 'available', 'withdrawn', 'refunded'), defaultValue: 'pending' },
    promoter_user_id: { type: DataTypes.BIGINT, allowNull: true },
    distributed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    settled_at: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'CommissionDistribution',
    tableName: 'commission_distributions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return CommissionDistribution;
};
