'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Post, { foreignKey: 'user_id', as: 'posts' });
      User.hasMany(models.Comment, { foreignKey: 'user_id', as: 'comments' });
      User.hasMany(models.Like, { foreignKey: 'user_id', as: 'likes' });
    }
  }
  User.init({
    openid: DataTypes.STRING,
    nickname: DataTypes.STRING,
    avatar_url: DataTypes.STRING,
    bg_image: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    bank_num: DataTypes.STRING,
    wx_id: DataTypes.STRING,
    role: DataTypes.STRING,      // user, promoter, admin
    balance: DataTypes.DECIMAL(10, 2),
    community_id: DataTypes.INTEGER,
    token_version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};
