const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BenefitAllianceGoods = sequelize.define('BenefitAllianceGoods', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    platform: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'jd',
      comment: '平台：jd/pdd/taobao/meituan/shangou/shequn/tuixiao/brand',
    },
    scene: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'benefit_card',
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
    },
    goods_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
    },
    spread_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
    },
    mini_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
    },
    keyword: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
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
  }, {
    tableName: 'benefit_alliance_goods',
    timestamps: true,
    underscored: true,
  });

  return BenefitAllianceGoods;
};
