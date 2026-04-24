'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BenefitAllianceConfig extends Model {
    static associate() {}
  }
  BenefitAllianceConfig.init({
    scene: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'benefit_card' },
    platform: { type: DataTypes.STRING(8), allowNull: false },
    hero_image_url: { type: DataTypes.STRING(512), allowNull: false },
    hero_title: { type: DataTypes.STRING(255), allowNull: true },
    hero_subtitle: { type: DataTypes.STRING(255), allowNull: true }
  }, {
    sequelize,
    modelName: 'BenefitAllianceConfig',
    tableName: 'benefit_alliance_config',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return BenefitAllianceConfig;
};
