'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ServiceFavorite extends Model {
    static associate(models) {}
  }

  ServiceFavorite.init({
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    kind: { type: DataTypes.STRING(32), allowNull: false },
    target_id: { type: DataTypes.BIGINT, allowNull: false },
    title: { type: DataTypes.STRING(200), defaultValue: '' },
    cover: { type: DataTypes.STRING(500), defaultValue: '' },
    price: { type: DataTypes.STRING(32), defaultValue: '' },
    url: { type: DataTypes.STRING(500), allowNull: false }
  }, {
    sequelize,
    modelName: 'ServiceFavorite',
    tableName: 'service_favorites',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id', 'kind', 'target_id'], unique: true },
      { fields: ['user_id', 'created_at'] }
    ]
  });

  return ServiceFavorite;
};
