'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatGroupMessage extends Model {
    static associate(models) {
      ChatGroupMessage.belongsTo(models.User, { foreignKey: 'sender_id', as: 'sender' });
      ChatGroupMessage.belongsTo(models.ChatGroup, { foreignKey: 'group_id', as: 'group' });
    }
  }
  ChatGroupMessage.init({
    group_id: { type: DataTypes.BIGINT, allowNull: false },
    sender_id: { type: DataTypes.BIGINT, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    msg_type: { type: DataTypes.ENUM('text', 'image', 'voice'), allowNull: false, defaultValue: 'text' },
    media_url: { type: DataTypes.STRING(500), defaultValue: '' }
  }, {
    sequelize,
    modelName: 'ChatGroupMessage',
    tableName: 'chat_group_messages',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return ChatGroupMessage;
};
