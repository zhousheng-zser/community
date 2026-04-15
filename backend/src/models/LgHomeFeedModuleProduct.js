'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LgHomeFeedModuleProduct extends Model {
    static associate(models) {}
  }
  LgHomeFeedModuleProduct.init(
    {
      module_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      goods_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
    },
    {
      sequelize,
      modelName: 'LgHomeFeedModuleProduct',
      tableName: 'lg_home_feed_module_products',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['module_id', 'status', 'sort'], name: 'idx_lg_feed_prod_mod' },
        { fields: ['goods_id'], name: 'idx_lg_feed_prod_goods' }
      ]
    }
  );
  return LgHomeFeedModuleProduct;
};
