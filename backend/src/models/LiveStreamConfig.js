'use strict';
const { Model } = require('sequelize');
/**
 * 家推-视频号直播推广配置表 (live_streams)
 * 与原有 LiveStream/Shops 无关，专用于视频号 finder_username 下发
 */
module.exports = (sequelize, DataTypes) => {
  class LiveStreamConfig extends Model {
    static associate(models) {}
  }
  LiveStreamConfig.init({
    category: { type: DataTypes.STRING(50), allowNull: false, defaultValue: '热推直播间' },
    title: { type: DataTypes.STRING(100), allowNull: false },
    avatar_url: DataTypes.STRING(255),
    brand_logo: DataTypes.STRING(255),
    cover_image: DataTypes.STRING(255),
    rebate_info: { type: DataTypes.STRING(50), defaultValue: '10%' },
    promoters_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    hot_goods: DataTypes.JSON,
    finder_username: { type: DataTypes.STRING(100), allowNull: false },
    feed_id: DataTypes.STRING(100),
    is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'LiveStreamConfig',
    tableName: 'live_streams',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return LiveStreamConfig;
};
