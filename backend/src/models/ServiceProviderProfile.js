'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ServiceProviderProfile extends Model {
    static associate(models) {
      ServiceProviderProfile.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      ServiceProviderProfile.belongsTo(models.ServiceProviderApplication, { foreignKey: 'application_id', as: 'application' });
    }
  }
  ServiceProviderProfile.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    application_id: { type: DataTypes.INTEGER, allowNull: true },
    shop_name: { type: DataTypes.STRING(100), allowNull: false },
    contact_name: { type: DataTypes.STRING(50), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    license_url: { type: DataTypes.STRING(255), allowNull: false },
    shop_front_url: DataTypes.STRING(255),
    environment_url: DataTypes.JSON,
    id_card_url: DataTypes.STRING(255),
    certificate_url: DataTypes.JSON,
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' }
  }, {
    sequelize,
    modelName: 'ServiceProviderProfile',
    tableName: 'service_provider_profiles',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return ServiceProviderProfile;
};
