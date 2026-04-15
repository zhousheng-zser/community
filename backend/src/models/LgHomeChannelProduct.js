'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LgHomeChannelProduct extends Model {
    static associate(models) {}
  }
  LgHomeChannelProduct.init(
    {
      channel_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      goods_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
    },
    {
      sequelize,
      modelName: 'LgHomeChannelProduct',
      tableName: 'lg_home_channel_products',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['channel_id', 'status', 'sort'], name: 'idx_lg_ch_prod_ch' },
        { fields: ['goods_id'], name: 'idx_lg_ch_prod_goods' }
      ]
    }
  );
  return LgHomeChannelProduct;
};
