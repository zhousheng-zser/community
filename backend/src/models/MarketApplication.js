'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MarketApplication extends Model {
    static associate(models) {
      MarketApplication.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      MarketApplication.belongsTo(models.User, { foreignKey: 'promoter_id', as: 'promoter' });
    }
  }
  MarketApplication.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    contact_name: { type: DataTypes.STRING(50), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    shop_name: { type: DataTypes.STRING(100), allowNull: false },
    category: { type: DataTypes.STRING(50), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: false },
    description: DataTypes.TEXT,
    promoter_id: DataTypes.INTEGER,
    credit_code: DataTypes.STRING(100),
    legal_person: DataTypes.STRING(50),
    place_photo_url: DataTypes.JSON,
    license_url: DataTypes.STRING(255),
    community_id: DataTypes.INTEGER,
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' }
  }, {
    sequelize,
    modelName: 'MarketApplication',
    tableName: 'market_applications',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return MarketApplication;
};
