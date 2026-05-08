'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/database.js')[env];

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

/**
 * 加载模型文件
 * @param {string} dir 模型所在目录
 */
function loadModels(dir) {
  if (!fs.existsSync(dir)) return;

  fs.readdirSync(dir)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1
      );
    })
    .forEach(file => {
      const modelPath = path.join(dir, file);
      const model = require(modelPath)(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    });
}

// 1. 加载 src/models/ 下的模型（遗留兼容）
loadModels(__dirname);

// 2. 加载各业务模块下的模型
const modulesDir = path.join(__dirname, '..', 'modules');
if (fs.existsSync(modulesDir)) {
  fs.readdirSync(modulesDir)
    .filter(name => {
      const modulePath = path.join(modulesDir, name);
      return fs.statSync(modulePath).isDirectory();
    })
    .forEach(moduleName => {
      const moduleModelsDir = path.join(modulesDir, moduleName, 'models');
      loadModels(moduleModelsDir);
    });
}

// 建立模型之间的关联
// [注意] 部分模型（如 User）由主后端提供，当前环境可能缺失。
// 使用 try-catch 跳过缺失关联，确保模块可独立加载和测试。
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
    } catch (err) {
      if (err.message && err.message.includes('not a subclass of Sequelize.Model')) {
        console.warn(`[models/index.js] 跳过 ${modelName}.associate()：关联目标模型在当前环境中缺失`);
      } else {
        throw err;
      }
    }
  }
});

// [说明] 以下模型由主后端提供（User, CouponTemplate, CouponIssue, UserFollow 等），
// 部署后由主后端的 models/index.js 统一加载，或在 Sequelize 初始化时通过 migrations 同步表结构。

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
