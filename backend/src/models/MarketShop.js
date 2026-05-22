'use strict';

module.exports = (sequelize, DataTypes) => {
  const MarketShop = sequelize.define('MarketShop', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: '店主用户ID'
    },
    shop_no: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ''
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '店铺Logo'
    },
    cover_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '店铺封面/门头'
    },
    notice: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    contact_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    contact_phone: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    business_hours: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_open: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    is_active: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    tableName: 'market_shops',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return MarketShop;
};
