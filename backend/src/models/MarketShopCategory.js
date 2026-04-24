'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MarketShopCategory extends Model {
    static associate(models) {}
  }
  MarketShopCategory.init({
    shop_id: { type: DataTypes.INTEGER, allowNull: false },
    category_key: { type: DataTypes.STRING(50), allowNull: false },
    category_name: { type: DataTypes.STRING(50), allowNull: false },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
  }, {
    sequelize,
    modelName: 'MarketShopCategory',
    tableName: 'market_shop_categories',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['shop_id', 'category_key'], name: 'uk_shop_category_key' },
      { fields: ['shop_id', 'sort_order'], name: 'idx_shop_sort' }
    ]
  });
  return MarketShopCategory;
};
