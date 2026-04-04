const { DataTypes } = require('sequelize');

/**
 * 惠民卡 · 京东联盟：单表存储列表项
 * 每一行 = 一个商品：主图 + 推广链接（spread_url）+ 展示字段
 */
module.exports = (sequelize) => {
  const JdBenefitGood = sequelize.define(
    'JdBenefitGood',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      scene: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'benefit_card',
        comment: '投放场景，与小程序 query scene 对齐'
      },
      sku_id: {
        type: DataTypes.STRING(32),
        allowNull: false,
        comment: '京挑客短链 path 段（与 u.jd.com/{sku_id}、proxy 参数一致），非京东数字 SKU'
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      image_url: {
        type: DataTypes.STRING(1024),
        allowNull: false,
        comment: '列表主图 URL'
      },
      spread_url: {
        type: DataTypes.STRING(1024),
        allowNull: false,
        comment: '京挑客/联盟推广链接，供跳转京东联盟小程序'
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      rebate_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '展示用返利金额'
      },
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
        comment: '1 上架 0 下架'
      }
    },
    {
      tableName: 'jd_benefit_goods',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      indexes: [
        { fields: ['scene', 'status', 'sort_order'] },
        { unique: true, fields: ['scene', 'sku_id'], name: 'uk_jd_benefit_scene_sku' }
      ]
    }
  );

  return JdBenefitGood;
};
