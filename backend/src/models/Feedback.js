'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Feedback extends Model {
    static associate(models) {
      Feedback.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  Feedback.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    contact: DataTypes.STRING(100)
  }, {
    sequelize,
    modelName: 'Feedback',
    tableName: 'feedback',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return Feedback;
};
