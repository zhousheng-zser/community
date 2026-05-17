'use strict';

module.exports = (sequelize, DataTypes) => {
  const MarketShopCategory = sequelize.define('MarketShopCategory', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    shop_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: '所属店铺ID'
    },
    category_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '店内分类Key'
    },
    category_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '店内分类名称'
    },
    sort_order: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '排序权重'
    }
  }, {
    tableName: 'market_shop_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['shop_id'] },
      { unique: true, fields: ['shop_id', 'category_key'] }
    ]
  });

  return MarketShopCategory;
};
