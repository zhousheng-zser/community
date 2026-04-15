'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LgHomeFeedModule extends Model {
    static associate(models) {}
  }
  LgHomeFeedModule.init(
    {
      module_name: { type: DataTypes.STRING(80), allowNull: false },
      sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
    },
    {
      sequelize,
      modelName: 'LgHomeFeedModule',
      tableName: 'lg_home_feed_modules',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['status', 'sort'], name: 'idx_lg_feed_mod_status' }]
    }
  );
  return LgHomeFeedModule;
};
