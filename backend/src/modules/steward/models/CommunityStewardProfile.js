'use strict';

module.exports = (sequelize, DataTypes) => {
  const CommunityStewardProfile = sequelize.define('CommunityStewardProfile', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    community_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    community_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: ''
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ''
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: ''
    },
    hotline: {
      type: DataTypes.STRING(32),
      allowNull: true,
      defaultValue: ''
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'community_steward_profiles',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return CommunityStewardProfile;
};
