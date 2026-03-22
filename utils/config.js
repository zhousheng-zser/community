/**
 * 小程序全局配置文件
 */
const config = {
    // 当前使用的 API 基础地址
    baseUrl: 'http://114.55.167.14:3000/api/v1',

    // 静态资源（图片）基础地址，上传到服务器的图片均通过此前缀访问
    imageBaseUrl: 'http://114.55.167.14:3000',

    // 家集市店铺列表：默认筛选半径（公里），与 GET market/shops 的 radius_km 及后端配置对齐（产品约定 X=5）
    marketShopRadiusKm: 5,
};

module.exports = config;
