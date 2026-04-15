'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ActivityParticipant extends Model {
    static associate(models) {
      ActivityParticipant.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      ActivityParticipant.belongsTo(models.Activity, { foreignKey: 'activity_id', as: 'activity' });
    }
  }
  ActivityParticipant.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    activity_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    sequelize,
    modelName: 'ActivityParticipant',
    tableName: 'activity_participants',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return ActivityParticipant;
};
