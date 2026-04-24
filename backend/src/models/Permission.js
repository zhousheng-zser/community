'use strict';

module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '权限名称'
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '权限编码'
    },
    type: {
      type: DataTypes.ENUM('menu', 'button', 'api'),
      defaultValue: 'menu',
      comment: '权限类型'
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '父级权限ID'
    },
    path: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '菜单路径或API路径'
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '菜单图标'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态'
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
    tableName: 'permissions',
    timestamps: false
  });

  Permission.associate = function(models) {
    Permission.belongsToMany(models.Role, {
      through: 'role_permissions',
      foreignKey: 'permission_id',
      otherKey: 'role_id',
      as: 'roles'
    });
    Permission.hasMany(models.Permission, {
      foreignKey: 'parent_id',
      as: 'children'
    });
    Permission.belongsTo(models.Permission, {
      foreignKey: 'parent_id',
      as: 'parent'
    });
  };

  return Permission;
};
