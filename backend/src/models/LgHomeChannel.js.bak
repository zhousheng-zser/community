'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LgHomeChannel extends Model {
    static associate(models) {}
  }
  LgHomeChannel.init(
    {
      channel_key: { type: DataTypes.STRING(40), allowNull: false },
      title: { type: DataTypes.STRING(80), allowNull: false },
      sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
    },
    {
      sequelize,
      modelName: 'LgHomeChannel',
      tableName: 'lg_home_channels',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['channel_key'], name: 'uk_lg_channel_key' },
        { fields: ['status', 'sort'], name: 'idx_lg_channel_status' }
      ]
    }
  );
  return LgHomeChannel;
};
