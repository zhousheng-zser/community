'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PromoterWithdrawal extends Model {
    static associate(models) {
      PromoterWithdrawal.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  PromoterWithdrawal.init({
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    status: { type: DataTypes.ENUM('pending', 'processing', 'completed', 'rejected'), defaultValue: 'pending' },
    remark: { type: DataTypes.STRING(500), defaultValue: '' }
  }, {
    sequelize,
    modelName: 'PromoterWithdrawal',
    tableName: 'promoter_withdrawals',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return PromoterWithdrawal;
};
