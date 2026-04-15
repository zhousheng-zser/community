'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WorkerApplication extends Model {
    static associate(models) {
      WorkerApplication.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  WorkerApplication.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(50), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    industry: { type: DataTypes.STRING(50), allowNull: false },
    education: DataTypes.STRING(50),
    city: DataTypes.STRING(50),
    resume: DataTypes.TEXT,
    id_card_url: { type: DataTypes.STRING(255), allowNull: false },
    work_photo_url: DataTypes.STRING(255),
    certificate_url: DataTypes.JSON,
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' }
  }, {
    sequelize,
    modelName: 'WorkerApplication',
    tableName: 'worker_applications',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return WorkerApplication;
};
