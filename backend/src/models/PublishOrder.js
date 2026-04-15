'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PublishOrder extends Model {
    static associate(models) {
      PublishOrder.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  PublishOrder.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING(50), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: false },
    expected_time: DataTypes.DATE,
    content: { type: DataTypes.TEXT, allowNull: false },
    images: DataTypes.JSON,
    status: { type: DataTypes.ENUM('pending', 'accepted', 'completed', 'cancelled'), defaultValue: 'pending' }
  }, {
    sequelize,
    modelName: 'PublishOrder',
    tableName: 'publish_orders',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return PublishOrder;
};
