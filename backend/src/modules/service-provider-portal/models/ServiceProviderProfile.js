'use strict';

module.exports = (sequelize, DataTypes) => {
  const ServiceProviderProfile = sequelize.define('ServiceProviderProfile', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: '所属用户ID'
    },
    shop_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '门店/服务商名称'
    },
    contact_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '联系人姓名'
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '联系人电话'
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '服务地址'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      comment: '纬度'
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      comment: '经度'
    },
    business_hours: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '营业时间'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '简介'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '主营分类'
    },
    logo: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Logo'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      comment: '状态: pending/approved/rejected/inactive/active'
    },
    reject_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '驳回原因'
    }
  }, {
    tableName: 'service_provider_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'], unique: true },
      { fields: ['status'] }
    ]
  });

  return ServiceProviderProfile;
};
