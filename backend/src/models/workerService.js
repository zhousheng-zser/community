'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WorkerService extends Model {
    static associate(models) {
      WorkerService.belongsTo(models.User, { foreignKey: 'worker_user_id', as: 'worker' });
      WorkerService.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
    }
  }
  WorkerService.init({
    worker_user_id: { type: DataTypes.INTEGER, allowNull: false },
    service_id: { type: DataTypes.INTEGER, allowNull: false },
    enabled: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'WorkerService',
    tableName: 'worker_services',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return WorkerService;
};
