/**
 * 小程序全局配置文件
 */
const config = {
    // 当前使用的 API 基础地址
    baseUrl: 'http://114.55.167.14:3001/api/v1',

    // 静态资源（图片）基础地址，上传到服务器的图片均通过此前缀访问
    imageBaseUrl: 'http://114.55.167.14:3001',

    /**
     * 已迁入后端 data/uploads/images 的一级目录；/img/<目录>/... 在 imgUrl 中转为 imageBaseUrl + /uploads/...（每段 encodeURIComponent）
     * 见 doc/微信小程序静态图片访问说明_TMP迁入.md；有新目录上传后在此追加。
     */
    uploadsImageSubdirs: [
        'benefit_alliance',
        'home_service_photos',
        'jd_benefit',
        'pdd_benefit',
        'service_home3',
        'worker_avatars',
        '京东联盟',
        '拼多多',
        '流量联盟',
        'chat',
    ],

    // 本地集市店铺列表：默认筛选半径（公里），与 GET market/shops 的 radius_km 及后端配置对齐（产品约定 X=5）
    marketShopRadiusKm: 5,

    /**
     * 首页「小区热卖榜」：false 时请求 core/community/hot（可带 community_id），失败则回退 core/services/hot；
     * true 时仅用本地示例列表（仅开发预览）。
     */
    useCuratedHomeHotList: false,

    /**
     * 惠民卡 · 多平台流量联盟
     * navigateToMiniProgram 需在小程序管理后台配置「跳转小程序」白名单（目标 AppId）。
     * benefitAlliancePreferLocal：true 时优先用 utils/benefitAllianceLocal.js（与 流量联盟/*.md 一致），
     * 有本地商品列表则不再请求 benefit/display 与 jd|pdd/benefit/goods 覆盖对应块。
     */
    benefitAlliancePreferLocal: true,

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
