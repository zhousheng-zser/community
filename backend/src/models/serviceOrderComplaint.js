'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ServiceOrderComplaint extends Model {
    static associate(models) {
      ServiceOrderComplaint.belongsTo(models.ServiceOrder, { foreignKey: 'order_id', as: 'order' });
      ServiceOrderComplaint.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  ServiceOrderComplaint.init({
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    images_json: { type: DataTypes.JSON, allowNull: true },
    status: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'open' }
  }, {
    sequelize,
    modelName: 'ServiceOrderComplaint',
    tableName: 'service_order_complaints',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return ServiceOrderComplaint;
};
