'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PartnerRelation extends Model {
    static associate(models) {
      PartnerRelation.belongsTo(models.User, { foreignKey: 'promoter_user_id', as: 'promoter' });
      PartnerRelation.belongsTo(models.User, { foreignKey: 'district_partner_user_id', as: 'districtPartner' });
      PartnerRelation.belongsTo(models.User, { foreignKey: 'market_partner_user_id', as: 'marketPartner' });
    }
  }

  PartnerRelation.init({
    promoter_user_id: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    district_partner_user_id: { type: DataTypes.BIGINT, allowNull: true },
    market_partner_user_id: { type: DataTypes.BIGINT, allowNull: true },
    resolved_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    is_valid: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'PartnerRelation',
    tableName: 'partner_relations',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return PartnerRelation;
};
