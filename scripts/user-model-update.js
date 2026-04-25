'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     */
    static associate(models) {
      User.hasMany(models.Post, { foreignKey: 'user_id', as: 'posts' });
      User.hasMany(models.Comment, { foreignKey: 'user_id', as: 'comments' });
      User.hasMany(models.Like, { foreignKey: 'user_id', as: 'likes' });
      // 邀请关系：一个用户可以邀请多个用户
      User.hasMany(models.User, { foreignKey: 'invited_by', as: 'invitees' });
      // 一个用户只能被一个用户邀请
      User.belongsTo(models.User, { foreignKey: 'invited_by', as: 'inviter' });
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
    role: DataTypes.STRING,
    balance: DataTypes.DECIMAL(10, 2),
    community_id: DataTypes.INTEGER,
    token_version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    invite_code: { type: DataTypes.STRING(16), allowNull: true },
    invited_by: { type: DataTypes.INTEGER, allowNull: true }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};
