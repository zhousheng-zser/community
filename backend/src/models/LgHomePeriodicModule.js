'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LgHomePeriodicModule extends Model {
    static associate(models) {}
  }
  LgHomePeriodicModule.init(
    {
      module_name: { type: DataTypes.STRING(80), allowNull: false },
      sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
    },
    {
      sequelize,
      modelName: 'LgHomePeriodicModule',
      tableName: 'lg_home_periodic_modules',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['status', 'sort'], name: 'idx_lg_periodic_mod_status' }]
    }
  );
  return LgHomePeriodicModule;
};
