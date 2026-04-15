'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ServiceOrder extends Model {
    static associate(models) {
      ServiceOrder.belongsTo(models.User, { foreignKey: 'user_id', as: 'buyer' });
      ServiceOrder.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
      ServiceOrder.belongsTo(models.User, { foreignKey: 'assigned_worker_id', as: 'assignedWorker' });
    }
  }
  ServiceOrder.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    community_id: { type: DataTypes.INTEGER, allowNull: true },
    service_id: { type: DataTypes.INTEGER, allowNull: false },
    group_key: { type: DataTypes.STRING(32), allowNull: true },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    address_id: { type: DataTypes.INTEGER, allowNull: true },
    address_snapshot: { type: DataTypes.JSON, allowNull: true },
    appointment_time: { type: DataTypes.DATE, allowNull: true },
    remark: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending_pay' },
    pay_status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'unpaid' },
    assigned_worker_id: { type: DataTypes.INTEGER, allowNull: true },
    dispatch_at: { type: DataTypes.DATE, allowNull: true },
    dispatch_by: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    sequelize,
    modelName: 'ServiceOrder',
    tableName: 'service_orders',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return ServiceOrder;
};
