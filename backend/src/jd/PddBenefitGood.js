const { DataTypes } = require('sequelize');

/**
 * 惠民卡 · 拼多多：单表存储列表项（主图 + 推广链接 + 券后价等）
 */
module.exports = (sequelize) => {
  const PddBenefitGood = sequelize.define(
    'PddBenefitGood',
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
      link_key: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: '推广 URL 路径唯一段，用于 upsert'
      },
      goods_id: {
        type: DataTypes.STRING(64),
        allowNull: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      image_url: {
        type: DataTypes.STRING(1024),
        allowNull: false
      },
      spread_url: {
        type: DataTypes.STRING(1024),
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      coupon_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '券后价'
      },
      rebate_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      mini_path: {
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
      tableName: 'pdd_benefit_goods',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      indexes: [
        { fields: ['scene', 'status', 'sort_order'] },
        { unique: true, fields: ['scene', 'link_key'], name: 'uk_pdd_benefit_scene_link' }
      ]
    }
  );

  return PddBenefitGood;
};
