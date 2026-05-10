'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MarketGood extends Model {
    static associate(models) {
      MarketGood.hasMany(models.MarketGoodSku, { foreignKey: 'goods_id', as: 'skus' });
      MarketGood.hasMany(models.MarketFavoriteItem, { foreignKey: 'goods_id', as: 'favoriteItems' });
      MarketGood.belongsTo(models.MarketShop, { foreignKey: 'shop_id', as: 'shop' });
    }
  }
  MarketGood.init({
    goods_no: { type: DataTypes.STRING(32), allowNull: false },
    shop_id: { type: DataTypes.INTEGER, allowNull: false },
    category_key: { type: DataTypes.STRING(50), allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
    description: DataTypes.STRING(255),
    main_image: DataTypes.STRING(255),
    images: DataTypes.JSON,
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    origin_price: DataTypes.DECIMAL(10, 2),
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    safe_stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    sold_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM('on_sale', 'off_sale'), allowNull: false, defaultValue: 'on_sale' },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    price_range: { type: DataTypes.STRING(64), allowNull: true },
    desc_html: { type: DataTypes.TEXT, allowNull: true }
  }, {
    sequelize,
    modelName: 'MarketGood',
    tableName: 'market_goods',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['goods_no'], name: 'uk_goods_no' },
      { fields: ['shop_id', 'category_key', 'status', 'sort_order'], name: 'idx_shop_category_status' },
      { fields: ['shop_id', 'status'], name: 'idx_shop_status' }
    ]
  });
  return MarketGood;
};
