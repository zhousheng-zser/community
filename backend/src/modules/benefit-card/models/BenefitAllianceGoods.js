const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BenefitAllianceGoods = sequelize.define('BenefitAllianceGoods', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    platform: {
      type: DataTypes.ENUM('jd', 'pdd', 'taobao', 'meituan', 'brand'),
      allowNull: false,
      defaultValue: 'jd',
      comment: '平台：jd京东 pdd拼多多 taobao淘宝 meituan美团 brand品牌餐饮',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '',
    },
    subtitle: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    coupon_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    rebate_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    sku_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '京东SKU',
    },
    goods_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '拼多多/淘宝商品ID',
    },
    spread_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '推广链接',
    },
    mini_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '小程序跳转路径',
    },
    keyword: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '品牌关键词，大牌餐饮用',
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    scene: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'benefit_card',
      comment: '使用场景',
    },
  }, {
    tableName: 'benefit_alliance_goods',
    timestamps: true,
    underscored: true,
  });

  return BenefitAllianceGoods;
};
