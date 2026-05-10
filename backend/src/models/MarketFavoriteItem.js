'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MarketFavoriteItem extends Model {
    static associate(models) {
      MarketFavoriteItem.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      MarketFavoriteItem.belongsTo(models.MarketGood, { foreignKey: 'goods_id', as: 'good' });
      MarketFavoriteItem.belongsTo(models.MarketShop, { foreignKey: 'shop_id', as: 'shop' });
    }
  }
  MarketFavoriteItem.init(
    {
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      goods_id: { type: DataTypes.INTEGER, allowNull: false },
      shop_id: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
      sequelize,
      modelName: 'MarketFavoriteItem',
      tableName: 'market_favorite_items',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['user_id', 'goods_id'], name: 'uk_user_goods' },
        { fields: ['user_id', 'created_at'], name: 'idx_user_created' },
        { fields: ['user_id', 'shop_id'], name: 'idx_user_shop' },
        { fields: ['goods_id'], name: 'idx_goods' }
      ]
    }
  );
  return MarketFavoriteItem;
};
