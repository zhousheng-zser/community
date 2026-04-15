'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LgHomeZoneGiftSubcategory extends Model {
    static associate(models) {}
  }
  LgHomeZoneGiftSubcategory.init(
    {
      zone_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      sub_code: { type: DataTypes.STRING(50), allowNull: false },
      name: { type: DataTypes.STRING(50), allowNull: false },
      cover_image: DataTypes.STRING(255),
      sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
    },
    {
      sequelize,
      modelName: 'LgHomeZoneGiftSubcategory',
      tableName: 'lg_home_zone_gift_subcategories',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['zone_id', 'status', 'sort'], name: 'idx_lg_gift_sub_z' }]
    }
  );
  return LgHomeZoneGiftSubcategory;
};
