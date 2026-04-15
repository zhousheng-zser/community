'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LgHomeZoneSidebarCategory extends Model {
    static associate(models) {}
  }
  LgHomeZoneSidebarCategory.init(
    {
      zone_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      category_name: { type: DataTypes.STRING(50), allowNull: false },
      sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
    },
    {
      sequelize,
      modelName: 'LgHomeZoneSidebarCategory',
      tableName: 'lg_home_zone_sidebar_categories',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['zone_id', 'status', 'sort'], name: 'idx_lg_sidebar_z' }]
    }
  );
  return LgHomeZoneSidebarCategory;
};
