/**
 * 小程序全局配置文件
 */
const config = {
    // 当前使用的 API 基础地址
    // 开发环境可以切换为 http://127.0.0.1:3000/api/v1/
    // 目前使用云服务器部署对应的公网地址：
    baseUrl: 'http://114.55.167.14:3000/api/v1',

    // 如果需要 https 可以取消注释下面这行（注意确保云服务器配置了 SSL 证书）
    // baseUrl: 'https://114.55.167.14:3000/api/v1',
};

module.exports = config;
