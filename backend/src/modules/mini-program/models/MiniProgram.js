'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MiniProgram extends Model {
    static associate(models) {}
  }
  MiniProgram.init({
    name: { type: DataTypes.STRING(100), defaultValue: '' },
    app_id: { type: DataTypes.STRING(100), defaultValue: '' },
    path: { type: DataTypes.STRING(500), defaultValue: '' },
    icon_url: { type: DataTypes.STRING(500), defaultValue: '' },
    description: { type: DataTypes.STRING(500), defaultValue: '' },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'MiniProgram',
    tableName: 'mini_programs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return MiniProgram;
};
