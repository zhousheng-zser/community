'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Conversation extends Model {
        static associate(models) {
            // 关联中间表：一个 Conversation 包含多个参与者（通常是两人，或一人一机器人）
            Conversation.hasMany(models.UserConversation, { foreignKey: 'conversation_id', as: 'participants' });
            // 一个会话包含多条消息
            Conversation.hasMany(models.Message, { foreignKey: 'conversation_id', as: 'messages' });
        }
    }
    Conversation.init({
        type: {
            type: DataTypes.ENUM('private', 'system'),
            defaultValue: 'private',
            comment: '会话类型：私聊 或 系统通知'
        },
        last_message_preview: {
            type: DataTypes.STRING,
            comment: '最新一条消息的内容预览（限制长度）'
        }
    }, {
        sequelize,
        modelName: 'Conversation',
        tableName: 'Conversations',
        timestamps: true, // 会自动带有 created_at 和 updated_at，后者用于会话列表排序
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    return Conversation;
};
