'use strict';

module.exports = (sequelize, DataTypes) => {
  const CommunityStewardApplication = sequelize.define('CommunityStewardApplication', {
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
    gender: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: ''
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
    id_card: {
      type: DataTypes.STRING(32),
      allowNull: true,
      defaultValue: ''
    },
    id_card_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    intro: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending'
    },
    reject_reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    reviewed_by: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'community_steward_applications',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return CommunityStewardApplication;
};
