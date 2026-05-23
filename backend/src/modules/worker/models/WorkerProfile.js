'use strict';

module.exports = (sequelize, DataTypes) => {
  const WorkerProfile = sequelize.define('WorkerProfile', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: '技工用户ID'
    },
    community_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: '服务小区ID'
    },
    real_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '真实姓名'
    },
    industry: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    main_direction: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    resume: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    work_photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '工作台封面/工作生活照'
    },
    gender: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      comment: 'active/inactive'
    }
  }, {
    tableName: 'worker_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['community_id', 'status'] }
    ]
  });

  return WorkerProfile;
};
