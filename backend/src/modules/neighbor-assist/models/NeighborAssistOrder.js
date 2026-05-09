'use strict';

module.exports = (sequelize, DataTypes) => {
  const NeighborAssistOrder = sequelize.define('NeighborAssistOrder', {
    assist_type: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    community_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    origin_address_snapshot: {
      type: DataTypes.JSON,
      allowNull: false
    },
    destination_address_snapshot: {
      type: DataTypes.JSON,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    appointment_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'pending_pay'
    },
    pay_status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'unpaid'
    },
    assigned_worker_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    dispatch_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    dispatch_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    points_earned: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'neighbor_assist_orders',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  NeighborAssistOrder.associate = (models) => {
    NeighborAssistOrder.belongsTo(models.User, { foreignKey: 'user_id', as: 'publisher' });
    NeighborAssistOrder.belongsTo(models.User, { foreignKey: 'user_id', as: 'buyer' });
    NeighborAssistOrder.belongsTo(models.User, { foreignKey: 'assigned_worker_id', as: 'assignedWorker' });
  };

  return NeighborAssistOrder;
};
