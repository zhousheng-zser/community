'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatGroupMember extends Model {
    static associate(models) {
      ChatGroupMember.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      ChatGroupMember.belongsTo(models.ChatGroup, { foreignKey: 'group_id', as: 'group' });
    }
  }
  ChatGroupMember.init({
    group_id: { type: DataTypes.BIGINT, allowNull: false },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    role: { type: DataTypes.ENUM('owner', 'admin', 'member'), allowNull: false, defaultValue: 'member' },
    joined_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'ChatGroupMember',
    tableName: 'chat_group_members',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return ChatGroupMember;
};
