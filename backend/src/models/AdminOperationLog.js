'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AdminOperationLog extends Model {
    static associate() {}
  }
  AdminOperationLog.init({
    admin_username: { type: DataTypes.STRING(100), allowNull: false },
    action: { type: DataTypes.STRING(100), allowNull: false },
    target_type: DataTypes.STRING(80),
    target_id: DataTypes.STRING(80),
    detail_json: DataTypes.JSON,
    ip: DataTypes.STRING(64)
  }, {
    sequelize,
    modelName: 'AdminOperationLog',
    tableName: 'admin_operation_logs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return AdminOperationLog;
};
