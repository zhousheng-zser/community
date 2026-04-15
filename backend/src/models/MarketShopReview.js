'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MarketShopReview extends Model {
    static associate(models) {}
  }
  MarketShopReview.init({
    shop_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    rating: { type: DataTypes.TINYINT, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    images: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'MarketShopReview',
    tableName: 'market_shop_reviews',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['shop_id'], name: 'idx_shop_reviews_shop' },
      { fields: ['created_at'], name: 'idx_shop_reviews_ctime' }
    ]
  });
  return MarketShopReview;
};
