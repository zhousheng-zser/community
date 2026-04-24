'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MarketShop extends Model {
    static associate(models) {
      MarketShop.hasMany(models.MarketGood, { foreignKey: 'shop_id', as: 'goods' });
    }
  }
  MarketShop.init({
    shop_no: { type: DataTypes.STRING(32), allowNull: false },
    name: { type: DataTypes.STRING(120), allowNull: false },
    category: { type: DataTypes.STRING(50), allowNull: false },
    logo_url: DataTypes.STRING(255),
    cover_url: DataTypes.STRING(255),
    notice: DataTypes.STRING(255),
    delivery_type: { type: DataTypes.ENUM('platform', 'merchant', 'self_pickup'), defaultValue: 'platform' },
    min_order_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
    delivery_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
    avg_delivery_minutes: { type: DataTypes.INTEGER, defaultValue: 30 },
    rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 4.8 },
    sold_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    is_open: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    is_active: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    address: DataTypes.STRING(255),
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true, comment: 'GCJ-02' },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true, comment: 'GCJ-02' },
    contact_name: DataTypes.STRING(50),
    contact_phone: DataTypes.STRING(30),
    business_hours: DataTypes.STRING(100),
    facade_image: DataTypes.STRING(255),
    interior_image: DataTypes.STRING(255),
    license_image: DataTypes.STRING(255)
  }, {
    sequelize,
    modelName: 'MarketShop',
    tableName: 'market_shops',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['shop_no'], name: 'uk_shop_no' },
      { fields: ['category', 'is_active', 'is_open'], name: 'idx_category_active' },
      { fields: ['sort_order'], name: 'idx_sort_order' }
    ]
  });
  return MarketShop;
};
