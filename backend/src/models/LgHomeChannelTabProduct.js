'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LgHomeChannelTabProduct extends Model {
    static associate(models) {}
  }
  LgHomeChannelTabProduct.init(
    {
      tab_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      goods_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      shop_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
    },
    {
      sequelize,
      modelName: 'LgHomeChannelTabProduct',
      tableName: 'lg_home_channel_tab_products',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['tab_id', 'status', 'sort'], name: 'idx_lg_ch_tabp_tab' },
        { fields: ['goods_id'], name: 'idx_lg_ch_tabp_goods' }
      ]
    }
  );
  return LgHomeChannelTabProduct;
};
