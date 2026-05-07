'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SystemConfig extends Model {
    static associate(models) {
      // No associations needed
    }

    /** Get a config value by key, parsed according to config_type */
    static async get(key) {
      const config = await this.findOne({ where: { config_key: key } });
      if (!config) return null;
      switch (config.config_type) {
        case 'decimal':
        case 'integer':
          return Number(config.config_value);
        case 'json':
          return JSON.parse(config.config_value);
        default:
          return config.config_value;
      }
    }

    /** Get multiple config values at once */
    static async getMany(keys) {
      const configs = await this.findAll({ where: { config_key: keys } });
      const result = {};
      configs.forEach(c => {
        switch (c.config_type) {
          case 'decimal':
          case 'integer':
            result[c.config_key] = Number(c.config_value);
            break;
          case 'json':
            result[c.config_key] = JSON.parse(c.config_value);
            break;
          default:
            result[c.config_key] = c.config_value;
        }
      });
      return result;
    }
  }

  SystemConfig.init({
    config_key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    config_value: { type: DataTypes.STRING(500), defaultValue: '' },
    config_type: { type: DataTypes.ENUM('decimal', 'integer', 'string', 'json'), defaultValue: 'string' },
    description: { type: DataTypes.STRING(500) },
    is_public: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    sequelize,
    modelName: 'SystemConfig',
    tableName: 'system_configs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return SystemConfig;
};
