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
      User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orders' });
    }
  }
  User.init({
    openid: DataTypes.STRING,
    nickname: DataTypes.STRING,
    avatar_url: DataTypes.STRING,
    bg_image: DataTypes.STRING,
    phone: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};
