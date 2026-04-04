const { DataTypes } = require('sequelize');

/**
 * 惠民卡联盟页展示配置：京东 / 拼多多顶部横幅与可选标题（商品仍在 jd_benefit_goods、pdd_benefit_goods）
 */
module.exports = (sequelize) => {
  const BenefitAllianceConfig = sequelize.define(
    'BenefitAllianceConfig',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      scene: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'benefit_card'
      },
      platform: {
        type: DataTypes.STRING(16),
        allowNull: false,
        comment: 'jd 或 pdd'
      },
      hero_image_url: {
        type: DataTypes.STRING(1024),
        allowNull: false
      },
      hero_title: {
        type: DataTypes.STRING(128),
        allowNull: true
      },
      hero_subtitle: {
        type: DataTypes.STRING(512),
        allowNull: true
      },
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1
      }
    },
    {
      tableName: 'benefit_alliance_config',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      indexes: [
        { unique: true, fields: ['scene', 'platform'], name: 'uk_benefit_alliance_scene_platform' },
        { fields: ['scene', 'status'] }
      ]
    }
  );

  return BenefitAllianceConfig;
};
