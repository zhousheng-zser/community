'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LgHomeChannelTab extends Model {
    static associate(models) {}
  }
  LgHomeChannelTab.init(
    {
      channel_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      tab_name: { type: DataTypes.STRING(80), allowNull: false },
      sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
    },
    {
      sequelize,
      modelName: 'LgHomeChannelTab',
      tableName: 'lg_home_channel_tabs',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['channel_id', 'status', 'sort'], name: 'idx_lg_ch_tab_ch' }]
    }
  );
  return LgHomeChannelTab;
};
