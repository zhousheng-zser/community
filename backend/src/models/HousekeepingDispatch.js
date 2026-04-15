'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HousekeepingDispatch extends Model {
    static associate(models) {
      HousekeepingDispatch.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
      HousekeepingDispatch.belongsTo(models.User, { foreignKey: 'worker_id', as: 'worker' });
      HousekeepingDispatch.belongsTo(models.ServiceProviderProfile, { foreignKey: 'service_provider_id', as: 'serviceProvider' });
    }
  }
  HousekeepingDispatch.init({
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    worker_id: { type: DataTypes.INTEGER, allowNull: false },
    service_provider_id: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'assigned' },
    note: DataTypes.TEXT,
    dispatcher: DataTypes.STRING(100)
  }, {
    sequelize,
    modelName: 'HousekeepingDispatch',
    tableName: 'housekeeping_dispatches',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return HousekeepingDispatch;
};
