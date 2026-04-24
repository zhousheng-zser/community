'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WorkerProfile extends Model {
    static associate(models) {
      WorkerProfile.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      WorkerProfile.belongsTo(models.WorkerApplication, { foreignKey: 'application_id', as: 'application' });
    }
  }
  WorkerProfile.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    application_id: { type: DataTypes.INTEGER, allowNull: true },
    real_name: { type: DataTypes.STRING(50), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    industry: { type: DataTypes.STRING(50), allowNull: false },
    education: DataTypes.STRING(50),
    city: DataTypes.STRING(50),
    resume: DataTypes.TEXT,
    id_card_url: DataTypes.STRING(255),
    work_photo_url: DataTypes.STRING(255),
    certificate_url: DataTypes.JSON,
    community_id: DataTypes.INTEGER,
    gender: DataTypes.STRING(8),
    main_direction: DataTypes.STRING(120),
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' }
  }, {
    sequelize,
    modelName: 'WorkerProfile',
    tableName: 'worker_profiles',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return WorkerProfile;
};
