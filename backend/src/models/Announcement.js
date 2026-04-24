'use strict';

module.exports = (sequelize, DataTypes) => {
  const Announcement = sequelize.define('Announcement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '公告标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '公告内容'
    },
    type: {
      type: DataTypes.ENUM('system', 'community', 'activity'),
      defaultValue: 'system',
      comment: '公告类型'
    },
    community_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '所属社区ID，为空则全局公告'
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '优先级，数字越大越靠前'
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'expired'),
      defaultValue: 'draft',
      comment: '状态'
    },
    publish_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发布时间'
    },
    expire_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '过期时间'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '创建人ID'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'announcements',
    timestamps: false
  });

  Announcement.associate = function(models) {
    Announcement.belongsTo(models.Community, { foreignKey: 'community_id', as: 'community' });
  };

  return Announcement;
};
