'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PartnerRole extends Model {
    static associate(models) {
      PartnerRole.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }

  PartnerRole.init({
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    role: { type: DataTypes.ENUM('promoter', 'district_partner', 'market_partner'), allowNull: false },
    status: { type: DataTypes.ENUM('active', 'inactive', 'pending_approval'), defaultValue: 'active' },
    approved_at: { type: DataTypes.DATE },
    approved_by: { type: DataTypes.BIGINT },
    district_code: { type: DataTypes.STRING(20) },
    market_code: { type: DataTypes.STRING(20) }
  }, {
    sequelize,
    modelName: 'PartnerRole',
    tableName: 'partner_roles',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return PartnerRole;
};
