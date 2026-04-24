'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ServiceProviderPortalAccount extends Model {
    static associate(models) {
      ServiceProviderPortalAccount.belongsTo(models.ServiceProviderProfile, {
        foreignKey: 'profile_id',
        as: 'profile'
      });
    }
  }
  ServiceProviderPortalAccount.init({
    profile_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    username: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: {
      type: DataTypes.ENUM('owner', 'operator'),
      allowNull: false,
      defaultValue: 'owner'
    },
    status: {
      type: DataTypes.ENUM('active', 'disabled'),
      allowNull: false,
      defaultValue: 'active'
    },
    last_login_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'ServiceProviderPortalAccount',
    tableName: 'service_provider_portal_accounts',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return ServiceProviderPortalAccount;
};
