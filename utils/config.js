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
     * 首页「小区热卖榜」：为 true 时始终用 pages/index 内写死的示例列表，不请求 core/services/hot 覆盖。
     * 需要完全跟随后端热门接口时改为 false。
     */
    useCuratedHomeHotList: true,

    /**
     * 惠民卡 · 多平台流量联盟
     * navigateToMiniProgram 需在小程序管理后台配置「跳转小程序」白名单（目标 AppId）。
     */
    benefitAlliance: {
        jdUnionAppId: 'wx91d27dbf599dff74',
        /**
         * 拼多多官方微信小程序 AppID（多多进宝 / 微信侧「跳转其他小程序」文档常用，与 path 由接口 wx_app_url / miniPath 配合）
         * 若你方进宝返回的 we_app_info 指定其他 AppId，请改为与接口一致。
         */
        pddMiniAppId: 'wx32540bd863b27570'
    },
};

module.exports = config;
