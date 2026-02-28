'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: 'user_id', as: 'buyer' });
      Order.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
    }
  }
  Order.init({
    user_id: DataTypes.INTEGER,
    service_id: DataTypes.INTEGER,
    total_amount: DataTypes.DECIMAL,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};
