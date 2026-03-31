/**
 * 小程序全局配置文件
 */
const config = {
    // 当前使用的 API 基础地址
    baseUrl: 'http://114.55.167.14:3000/api/v1',

    // 静态资源（图片）基础地址，上传到服务器的图片均通过此前缀访问
    imageBaseUrl: 'http://114.55.167.14:3000',

    // 本地集市店铺列表：默认筛选半径（公里），与 GET market/shops 的 radius_km 及后端配置对齐（产品约定 X=5）
    marketShopRadiusKm: 5,

    /**
     * 惠民卡 · 多平台流量联盟
     * navigateToMiniProgram 需在小程序管理后台配置「跳转小程序」白名单（目标 AppId）。
     */
    benefitAlliance: {
        jdUnionAppId: 'wx91d27dbf599dff74',
        /** 拼多多官方小程序（用于带 miniPath 的直达跳转；空路径时走复制 H5 推广链接） */
        pddMiniAppId: 'wx32540bd863bfa725',
        /** 淘系小程序（如淘特等），留空则淘宝联盟仅使用复制推广链接 */
        taobaoMiniAppId: ''
    },
};

module.exports = config;
