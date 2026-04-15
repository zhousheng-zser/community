'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserAddress extends Model {
    static associate(models) {
      UserAddress.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  UserAddress.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(50), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    province: DataTypes.STRING(50),
    city: DataTypes.STRING(50),
    district: DataTypes.STRING(50),
    detail: { type: DataTypes.STRING(255), allowNull: false },
    tag: DataTypes.STRING(20),
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true, comment: 'GCJ-02' },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true, comment: 'GCJ-02' },
    location_poi_name: DataTypes.STRING(128),
    is_default: { type: DataTypes.TINYINT, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'UserAddress',
    tableName: 'user_addresses',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return UserAddress;
};
