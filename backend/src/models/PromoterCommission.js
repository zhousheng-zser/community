'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PromoterCommission extends Model {
    static associate(models) {
      PromoterCommission.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  PromoterCommission.init({
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    order_id: { type: DataTypes.STRING(100), defaultValue: '' },
    order_type: { type: DataTypes.STRING(50), defaultValue: '' },
    commission_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    status: { type: DataTypes.ENUM('pending', 'available', 'withdrawn'), defaultValue: 'pending' }
  }, {
    sequelize,
    modelName: 'PromoterCommission',
    tableName: 'promoter_commissions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return PromoterCommission;
};
