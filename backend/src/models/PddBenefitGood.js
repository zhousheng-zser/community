'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PddBenefitGood extends Model {
    static associate() {}
  }
  PddBenefitGood.init({
    scene: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'benefit_card' },
    link_key: { type: DataTypes.STRING(64), allowNull: false },
    goods_id: { type: DataTypes.STRING(64), allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    image_url: { type: DataTypes.STRING(512), allowNull: false },
    spread_url: { type: DataTypes.STRING(1024), allowNull: false },
    mini_path: { type: DataTypes.STRING(512), allowNull: true },
    price: DataTypes.STRING(32),
    coupon_price: DataTypes.STRING(32),
    rebate_amount: DataTypes.STRING(32),
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
  }, {
    sequelize,
    modelName: 'PddBenefitGood',
    tableName: 'pdd_benefit_goods',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return PddBenefitGood;
};
