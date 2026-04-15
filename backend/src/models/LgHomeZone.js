'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LgHomeZone extends Model {
    static associate(models) {}
  }
  LgHomeZone.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: false },
      zone_code: { type: DataTypes.STRING(32), allowNull: false },
      name: { type: DataTypes.STRING(80), allowNull: false },
      sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
    },
    {
      sequelize,
      modelName: 'LgHomeZone',
      tableName: 'lg_home_zones',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['status', 'sort'], name: 'idx_lg_zone_status' }]
    }
  );
  return LgHomeZone;
};
