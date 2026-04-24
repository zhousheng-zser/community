'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ServiceOrderReview extends Model {
    static associate(models) {
      ServiceOrderReview.belongsTo(models.ServiceOrder, { foreignKey: 'order_id', as: 'order' });
      ServiceOrderReview.belongsTo(models.User, { foreignKey: 'user_id', as: 'reviewer' });
    }
  }
  ServiceOrderReview.init({
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    worker_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    score: { type: DataTypes.TINYINT, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: true }
  }, {
    sequelize,
    modelName: 'ServiceOrderReview',
    tableName: 'service_order_reviews',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return ServiceOrderReview;
};
