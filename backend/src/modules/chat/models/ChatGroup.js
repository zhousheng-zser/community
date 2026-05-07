'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatGroup extends Model {
    static associate(models) {
      ChatGroup.belongsTo(models.User, { foreignKey: 'creator_id', as: 'creator' });
      ChatGroup.hasMany(models.ChatGroupMember, { foreignKey: 'group_id', as: 'members' });
      ChatGroup.hasMany(models.ChatGroupMessage, { foreignKey: 'group_id', as: 'messages' });
    }
  }
  ChatGroup.init({
    name: { type: DataTypes.STRING(100), allowNull: false, defaultValue: '' },
    avatar_url: { type: DataTypes.STRING(500), defaultValue: '' },
    creator_id: { type: DataTypes.BIGINT, allowNull: false },
    member_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    last_message: { type: DataTypes.STRING(500), defaultValue: '' },
    last_message_at: DataTypes.DATE,
    is_dismissed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  }, {
    sequelize,
    modelName: 'ChatGroup',
    tableName: 'chat_groups',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return ChatGroup;
};
