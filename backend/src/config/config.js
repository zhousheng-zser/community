require('dotenv').config({
    path: require('path').resolve(__dirname, '../../.env'),
    quiet: true
}); // 使用绝对路径；quiet 避免 dotenv 往 stderr 打广告，宝塔误判「启动失败」

const dbConfig = {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'community_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
};

module.exports = {
    development: dbConfig,
    test: dbConfig,
    production: {
        ...dbConfig,
        logging: false
    }
};
