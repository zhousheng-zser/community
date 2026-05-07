'use strict';

module.exports = (sequelize, DataTypes) => {
  const WorkerService = sequelize.define('WorkerPersonalService', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: '所属技工用户ID'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '服务名称'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '服务价格'
    },
    desc: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '服务描述'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      comment: 'active/disabled'
    }
  }, {
    tableName: 'worker_personal_services',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return WorkerService;
};
