'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Activity extends Model {
    static associate(models) {
      Activity.belongsToMany(models.User, {
        through: 'activity_participants',
        foreignKey: 'activity_id',
        otherKey: 'user_id',
        as: 'participants'
      });
    }
  }
  Activity.init({
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: DataTypes.TEXT,
    start_time: DataTypes.DATE,
    end_time: DataTypes.DATE,
    status: { type: DataTypes.STRING(20), defaultValue: 'active' }
  }, {
    sequelize,
    modelName: 'Activity',
    tableName: 'activities',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Activity;
};
