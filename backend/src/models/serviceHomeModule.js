'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ServiceHomeModule extends Model {}
  ServiceHomeModule.init({
    group_key: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(100), allowNull: false },
    price_unit: { type: DataTypes.STRING(20), allowNull: false, defaultValue: '次' },
    icon_url: { type: DataTypes.STRING(512), allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
  }, {
    sequelize,
    modelName: 'ServiceHomeModule',
    tableName: 'service_home_modules',
    timestamps: true,
    // 与迁移 createTable 中列名 createdAt/updatedAt 一致；全局 define.underscored 会误查 created_at
    underscored: false
  });
  return ServiceHomeModule;
};
