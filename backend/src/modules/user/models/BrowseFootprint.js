'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BrowseFootprint extends Model {
    static associate(models) {}
  }

  BrowseFootprint.init({
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    kind: { type: DataTypes.STRING(32), allowNull: false },
    dedupe_key: { type: DataTypes.STRING(128), allowNull: false },
    title: { type: DataTypes.STRING(200), defaultValue: '' },
    cover: { type: DataTypes.STRING(500), defaultValue: '' },
    url: { type: DataTypes.STRING(500), allowNull: false }
  }, {
    sequelize,
    modelName: 'BrowseFootprint',
    tableName: 'browse_footprints',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id', 'dedupe_key'], unique: true },
      { fields: ['user_id', 'created_at'] }
    ]
  });

  return BrowseFootprint;
};
