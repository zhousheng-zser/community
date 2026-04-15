'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ServiceProviderApplication extends Model {
    static associate(models) {
      ServiceProviderApplication.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  ServiceProviderApplication.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    shop_name: { type: DataTypes.STRING(100), allowNull: false },
    contact_name: { type: DataTypes.STRING(50), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    license_url: { type: DataTypes.STRING(255), allowNull: false },
    shop_front_url: DataTypes.STRING(255),
    environment_url: DataTypes.JSON,
    id_card_url: { type: DataTypes.STRING(255), allowNull: false },
    certificate_url: DataTypes.JSON,
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' }
  }, {
    sequelize,
    modelName: 'ServiceProviderApplication',
    tableName: 'service_provider_applications',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return ServiceProviderApplication;
};
