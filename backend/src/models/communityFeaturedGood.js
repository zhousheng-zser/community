'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CommunityFeaturedGood extends Model {
    static associate(models) {
      CommunityFeaturedGood.belongsTo(models.MarketGood, { foreignKey: 'market_good_id', as: 'marketGood' });
    }
  }
  CommunityFeaturedGood.init({
    community_id: { type: DataTypes.INTEGER, allowNull: false },
    market_good_id: { type: DataTypes.INTEGER, allowNull: false },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 }
  }, {
    sequelize,
    modelName: 'CommunityFeaturedGood',
    tableName: 'community_featured_goods',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return CommunityFeaturedGood;
};
