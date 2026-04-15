'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MerchantAccount extends Model {
    static associate(models) {
      MerchantAccount.belongsTo(models.MarketShop, { foreignKey: 'shop_id', as: 'shop' });
    }
  }
  MerchantAccount.init({
    shop_id: { type: DataTypes.BIGINT, allowNull: false },
    username: { type: DataTypes.STRING(80), allowNull: false },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('owner', 'manager', 'operator'), allowNull: false, defaultValue: 'operator' },
    status: { type: DataTypes.ENUM('active', 'disabled'), allowNull: false, defaultValue: 'active' },
    last_login_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'MerchantAccount',
    tableName: 'merchant_accounts',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return MerchantAccount;
};
