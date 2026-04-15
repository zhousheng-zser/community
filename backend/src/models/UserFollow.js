'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserFollow extends Model {
    static associate(models) {
      UserFollow.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      UserFollow.belongsTo(models.User, { foreignKey: 'follow_user_id', as: 'followUser' });
    }
  }
  UserFollow.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    follow_user_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    sequelize,
    modelName: 'UserFollow',
    tableName: 'user_follows',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return UserFollow;
};
