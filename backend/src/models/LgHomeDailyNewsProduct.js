'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LgHomeDailyNewsProduct extends Model {
    static associate(models) {}
  }
  LgHomeDailyNewsProduct.init(
    {
      goods_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
      start_at: DataTypes.DATE,
      end_at: DataTypes.DATE
    },
    {
      sequelize,
      modelName: 'LgHomeDailyNewsProduct',
      tableName: 'lg_home_daily_news_products',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['status', 'sort'], name: 'idx_lg_daily_status_sort' },
        { fields: ['goods_id'], name: 'idx_lg_daily_goods' }
      ]
    }
  );
  return LgHomeDailyNewsProduct;
};
