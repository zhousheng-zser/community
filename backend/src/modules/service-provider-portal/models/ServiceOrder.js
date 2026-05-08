'use strict';

module.exports = (sequelize, DataTypes) => {
  const ServiceOrder = sequelize.define('ServiceOrder', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    order_no: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
      comment: '订单编号'
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: '下单用户ID'
    },
    provider_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: '服务商profile_id'
    },
    provider_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: '服务商用户ID'
    },
    service_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: '服务项目ID'
    },
    service_title_snapshot: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '服务标题快照'
    },
    worker_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: '指派技工ID'
    },
    worker_user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: '技工用户ID'
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'pending_pay',
      comment: '订单状态'
    },
    pay_status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'unpaid',
      comment: '支付状态'
    },
    pay_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '支付金额'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '金额(兼容)'
    },
    contact_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '联系人姓名'
    },
    contact_phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
      comment: '联系人电话'
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '服务地址'
    },
    service_address: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '服务地址(兼容)'
    },
    appointment_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '预约时间'
    },
    book_time: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '预约时间文本(兼容)'
    },
    remark: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '备注'
    },
    cancel_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '取消原因'
    },
    check_in_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '打卡时间'
    },
    check_in_location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '打卡位置'
    },
    evidence_images: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '凭证图片JSON数组'
    },
    evidence_note: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '凭证备注'
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '完成时间'
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '支付时间'
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '取消时间'
    }
  }, {
    tableName: 'service_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['provider_id'] },
      { fields: ['provider_user_id'] },
      { fields: ['status'] },
      { fields: ['pay_status'] }
    ]
  });

  return ServiceOrder;
};
