'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Banner extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Banner.init({
    image_url: DataTypes.STRING,
    target_url: DataTypes.STRING,
    sort_order: DataTypes.INTEGER,
    link_type: { type: DataTypes.STRING(32), defaultValue: 'none' },
    link_value: DataTypes.STRING(512),
    scene: { type: DataTypes.STRING(32), defaultValue: 'home' }
  }, {
    sequelize,
    modelName: 'Banner',
  });
  return Banner;
};