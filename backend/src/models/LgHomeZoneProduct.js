'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LgHomeZoneProduct extends Model {
    static associate(models) {}
  }
  LgHomeZoneProduct.init(
    {
      zone_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      goods_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      gift_sub_code: DataTypes.STRING(50),
      sidebar_category: DataTypes.STRING(50),
      sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
    },
    {
      sequelize,
      modelName: 'LgHomeZoneProduct',
      tableName: 'lg_home_zone_products',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['zone_id', 'status', 'sort'], name: 'idx_lg_zone_prod_z' },
        { fields: ['goods_id'], name: 'idx_lg_zone_prod_goods' }
      ]
    }
  );
  return LgHomeZoneProduct;
};
