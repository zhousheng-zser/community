'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class JdBenefitGood extends Model {
    static associate() {}
  }
  JdBenefitGood.init({
    scene: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'benefit_card' },
    sku_id: { type: DataTypes.STRING(64), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    image_url: { type: DataTypes.STRING(512), allowNull: false },
    spread_url: { type: DataTypes.STRING(1024), allowNull: false },
    price: DataTypes.STRING(32),
    rebate_amount: DataTypes.STRING(32),
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
  }, {
    sequelize,
    modelName: 'JdBenefitGood',
    tableName: 'jd_benefit_goods',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return JdBenefitGood;
};
