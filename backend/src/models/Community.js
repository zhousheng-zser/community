'use strict';

module.exports = (sequelize, DataTypes) => {
  const Community = sequelize.define('Community', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '社区名称'
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '社区地址'
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '联系电话'
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      comment: '经度'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      comment: '纬度'
    },
    service_radius: {
      type: DataTypes.INTEGER,
      defaultValue: 3000,
      comment: '服务半径(米)'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'communities',
    timestamps: false
  });

  Community.associate = function(models) {
    Community.hasMany(models.User, { foreignKey: 'community_id', as: 'users' });
    Community.hasMany(models.WorkerProfile, { foreignKey: 'community_id', as: 'workers' });
    Community.hasMany(models.ServiceProviderProfile, { foreignKey: 'community_id', as: 'providers' });
  };

  return Community;
};
