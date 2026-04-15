'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ApprovalRecord extends Model {
    static associate() {}
  }
  ApprovalRecord.init({
    biz_type: { type: DataTypes.STRING(50), allowNull: false },
    biz_id: { type: DataTypes.STRING(80), allowNull: false },
    from_status: DataTypes.STRING(40),
    to_status: { type: DataTypes.STRING(40), allowNull: false },
    note: DataTypes.STRING(255),
    operator: DataTypes.STRING(100)
  }, {
    sequelize,
    modelName: 'ApprovalRecord',
    tableName: 'approval_records',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return ApprovalRecord;
};
