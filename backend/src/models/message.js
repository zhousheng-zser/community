'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Message extends Model {
        static associate(models) {
            // 消息属于一个会话
            Message.belongsTo(models.Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
            // 消息的发送者 (0 为系统机器人)
            Message.belongsTo(models.User, { foreignKey: 'sender_id', as: 'sender' });
        }
    }
    Message.init({
        conversation_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        sender_id: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '发送方的 User ID，如果是 0 则是系统发给用户的'
        },
        msg_type: {
            type: DataTypes.STRING,
            defaultValue: 'text',
            comment: '消息类型: text, image, ad_card (活动卡片), logistics (物流卡片) 等'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: '具体的文字内容，或是图片URL，或是卡片JSON字符串'
        }
    }, {
        sequelize,
        modelName: 'Message',
        tableName: 'Messages',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false // 消息发出后一般不可修改
    });
    return Message;
};
