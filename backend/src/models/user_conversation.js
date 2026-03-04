'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class UserConversation extends Model {
        static associate(models) {
            // 当前的列表拥有者
            UserConversation.belongsTo(models.User, { foreignKey: 'user_id', as: 'owner' });
            // 对应的会话
            UserConversation.belongsTo(models.Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
            // 对方（如果 peer_id 不是 0）
            UserConversation.belongsTo(models.User, { foreignKey: 'peer_id', as: 'peerUser' });
        }
    }
    UserConversation.init({
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        conversation_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        peer_id: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '对方的 User ID。如果是系统通知/机器人/商城，则为 0'
        },
        bot_type: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '用来区分系统通知类型，如 event, logistics, notices 等的头像标识'
        },
        unread_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '当前用户在这个会话里的未读消息总数'
        },
        is_deleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '用户是否在页面上左滑删除了此会话（软删除，来新消息时变为 false 重新出现）'
        }
    }, {
        sequelize,
        modelName: 'UserConversation',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    return UserConversation;
};
