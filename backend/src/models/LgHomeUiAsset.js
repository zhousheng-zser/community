'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LgHomeUiAsset extends Model {
    static associate() {}
  }
  LgHomeUiAsset.init({
    asset_key: { type: DataTypes.STRING(64), allowNull: false },
    label: { type: DataTypes.STRING(128), allowNull: false, defaultValue: '' },
    group_type: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'other' },
    image_url: { type: DataTypes.STRING(512), allowNull: false, defaultValue: '' },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'LgHomeUiAsset',
    tableName: 'lg_home_ui_assets',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return LgHomeUiAsset;
};
