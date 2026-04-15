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
      Order.belongsTo(models.User, { foreignKey: 'promoter_id', as: 'promoter' });
      Order.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' });
      // Order.belongsTo(models.Good, { foreignKey: 'goods_id', as: 'good' }); // 后续接入 Good 实体
    }
  }
  Order.init({
    order_no: DataTypes.STRING,
    user_id: DataTypes.INTEGER,
    service_id: DataTypes.INTEGER,
    goods_id: DataTypes.INTEGER,
    promoter_id: DataTypes.INTEGER,
    total_amount: DataTypes.DECIMAL(10, 2),
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};
