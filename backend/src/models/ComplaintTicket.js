'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ComplaintTicket extends Model {
    static associate() {}
  }
  ComplaintTicket.init({
    ticket_no: { type: DataTypes.STRING(40), allowNull: false },
    order_no: DataTypes.STRING(40),
    user_id: DataTypes.BIGINT,
    shop_id: DataTypes.BIGINT,
    type: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'order' },
    content: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('open', 'processing', 'resolved', 'closed'), allowNull: false, defaultValue: 'open' },
    reply: DataTypes.TEXT,
    resolved_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'ComplaintTicket',
    tableName: 'complaint_tickets',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return ComplaintTicket;
};
