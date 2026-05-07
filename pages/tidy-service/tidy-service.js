const images = require('../../utils/images.js');
const { listImageFromHome3 } = require('../../utils/serviceHome3.js');

function toNumberOrNull(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

Page({
  data: {
    navTopPadding: 20,
    pageTitle: "整理收纳",
    loading: true,
    categories: [],
    activeCategory: "hot",
    services: [],
    filteredServices: []
  },

  // 本地兜底数据（API 失败时使用）
  getPageConfig(key) {
    const allConfigs = {
      tidy: {
        title: "整理收纳",
        categories: ["热门服务", "厨房收纳", "搬家整理", "全屋收纳", "衣橱收纳"],
        priceUnit: "份",
        services: [
          { id: 1, category: "衣橱收纳",  title: "衣橱整理收纳【2小时】",     price: "196元/份", image: listImageFromHome3("衣橱整理收纳【2小时】", images.svcTidyCloset) },
          { id: 2, category: "厨房收纳",  title: "厨房整理收纳【2小时】",     price: "196元/份", image: listImageFromHome3("厨房整理收纳【2小时】", images.svcTidyKitchen) },
          { id: 3, category: "搬家整理",  title: "日式打包复原整理【2小时】", price: "216元/份", image: listImageFromHome3("日式打包复原整理【2小时】", images.svcTidyPacking) },
          { id: 4, category: "全屋收纳",  title: "全屋整理收纳【3小时】",     price: "292元/份", image: listImageFromHome3("全屋整理收纳【3小时】", images.svcTidyFullRoom) },
          { id: 5, category: "全屋收纳",  title: "全屋整理收纳【4小时】",     price: "385元/份", image: listImageFromHome3("全屋整理收纳【4小时】", images.svcTidyFullRoom) }
        ]
      },
      urgent_fix: {
        title: "家修急事",
        categories: ["热门服务", "净水器维修", "灯具维修", "柜子维修", "管道疏通", "手机维修", "电路维修", "水路维修", "马桶维修", "厨房烟道串味", "零星打胶家修杂事"],
        priceUnit: "次",
        services: [
          { id: 11, category: "净水器维修",     title: "净水器故障维修【1小时】",       price: "128元/次", image: listImageFromHome3("净水器故障维修【1小时】", images.svcRepairGeneral) },
          { id: 12, category: "灯具维修",       title: "灯具线路与灯体维修【1小时】",   price: "98元/次",  image: listImageFromHome3("灯具线路与灯体维修【1小时】", images.svcRepairElec) },
          { id: 13, category: "柜子维修",       title: "柜门铰链滑轨维修【1小时】",     price: "118元/次", image: listImageFromHome3("柜门铰链滑轨维修【1小时】", images.svcRepairGeneral) },
          { id: 14, category: "管道疏通",       title: "厨房/卫浴管道疏通【1小时】",   price: "158元/次", image: listImageFromHome3("厨房/卫浴管道疏通【1小时】", images.svcRepairWater) },
          { id: 15, category: "手机维修",       title: "上门手机维修【1小时】",         price: "129元/次", image: listImageFromHome3("上门手机维修【1小时】", images.svcRepairGeneral) },
          { id: 16, category: "电路维修",       title: "家庭电路故障维修【1小时】",     price: "169元/次", image: listImageFromHome3("家庭电路故障维修【1小时】", images.svcRepairElec) },
          { id: 17, category: "水路维修",       title: "家庭水路维修【1小时】",         price: "159元/次", image: listImageFromHome3("家庭水路维修【1小时】", images.svcRepairWater) },
          { id: 18, category: "马桶维修",       title: "马桶维修与配件更换【1小时】",   price: "139元/次", image: listImageFromHome3("马桶维修与配件更换【1小时】", images.svcRepairWater) },
          { id: 19, category: "厨房烟道串味",   title: "厨房烟道串味治理【1小时】",     price: "179元/次", image: listImageFromHome3("厨房烟道串味治理【1小时】", images.svcHood) },
          { id: 20, category: "零星打胶家修杂事", title: "零星打胶与家修杂事【1小时】", price: "99元/次",  image: listImageFromHome3("零星打胶与家修杂事【1小时】", images.svcRepairGeneral) }
        ]
      },
      appliance_clean: {
        title: "家电清洗",
        categories: ["热门服务", "漏水检测", "瓷砖空鼓", "地暖检测", "地暖清洗", "灯具清洗", "空调清洗", "油烟机清洗", "洗衣机清洗", "冰箱清洗", "热水器清洗"],
        priceUnit: "次",
        services: [
          { id: 21, category: "漏水检测",   title: "全屋漏水点检测【1小时】",     price: "129元/次", image: listImageFromHome3("全屋漏水点检测【1小时】", images.svcRepairWater) },
          { id: 22, category: "瓷砖空鼓",   title: "瓷砖空鼓排查检测【1小时】",   price: "109元/次", image: listImageFromHome3("瓷砖空鼓排查检测【1小时】", images.svcTile) },
          { id: 23, category: "地暖检测",   title: "地暖回路检测【1小时】",       price: "139元/次", image: listImageFromHome3("地暖回路检测【1小时】", images.svcFloor) },
          { id: 24, category: "地暖清洗",   title: "地暖管路清洗【2小时】",       price: "269元/次", image: listImageFromHome3("地暖管路清洗【2小时】", images.svcFloor) },
          { id: 25, category: "灯具清洗",   title: "灯具深度清洗【1小时】",       price: "99元/次",  image: listImageFromHome3("灯具深度清洗【1小时】", images.svcRepairElec) },
          { id: 26, category: "空调清洗",   title: "空调深度清洗【1小时】",       price: "129元/次", image: listImageFromHome3("空调深度清洗【1小时】", images.svcAircon) },
          { id: 27, category: "油烟机清洗", title: "油烟机拆洗【1小时】",         price: "159元/次", image: listImageFromHome3("油烟机拆洗【1小时】", images.svcHood) },
          { id: 28, category: "洗衣机清洗", title: "洗衣机桶内清洗【1小时】",     price: "149元/次", image: listImageFromHome3("洗衣机桶内清洗【1小时】", images.svcWasher) },
          { id: 29, category: "冰箱清洗",   title: "冰箱除菌清洗【1小时】",       price: "119元/次", image: listImageFromHome3("冰箱除菌清洗【1小时】", images.svcFridge) },
          { id: 30, category: "热水器清洗", title: "热水器内胆清洗【1小时】",     price: "139元/次", image: listImageFromHome3("热水器内胆清洗【1小时】", images.svcFridge) }
        ]
      },
      pioneer_clean: {
        title: "开荒保洁",
        categories: ["热门服务", "开荒保洁"],
        priceUnit: "份",
        services: [
          { id: 31, category: "开荒保洁", title: "新房开荒保洁【3小时】", price: "399元/份", image: listImageFromHome3("新房开荒保洁【3小时】", images.svcDeepClean) },
          { id: 32, category: "开荒保洁", title: "全屋深度开荒【4小时】", price: "499元/份", image: listImageFromHome3("全屋深度开荒【4小时】", images.svcDeepClean) }
        ]
      },
      mite_remove: {
        title: "除螨服务",
        categories: ["热门服务", "全床除螨", "居室除螨"],
        priceUnit: "次",
        services: [
          { id: 41, category: "全床除螨", title: "全床深度除螨【1小时】",  price: "139元/次", image: listImageFromHome3("全床深度除螨【1小时】", images.svcMattress) },
          { id: 42, category: "居室除螨", title: "居室除螨净化【2小时】",  price: "239元/次", image: listImageFromHome3("居室除螨净化【2小时】", images.svcMattress) }
        ]
      },
      furniture_care: {
        title: "家具养护",
        categories: ["热门服务", "地板翻新", "地暖检测", "地暖清洁", "床垫清洗", "沙发清洗", "窗帘清洁", "地毯清洗", "地板打蜡", "大理石抛光"],
        priceUnit: "次",
        services: [
          { id: 51, category: "地板翻新",   title: "木地板翻新养护【2小时】",     price: "299元/次", image: listImageFromHome3("木地板翻新养护【2小时】", images.svcFloor) },
          { id: 52, category: "地暖检测",   title: "地暖系统检测【1小时】",       price: "139元/次", image: listImageFromHome3("地暖系统检测【1小时】", images.svcFloor) },
          { id: 53, category: "地暖清洁",   title: "地暖系统清洁【2小时】",       price: "269元/次", image: listImageFromHome3("地暖系统清洁【2小时】", images.svcFloor) },
          { id: 54, category: "床垫清洗",   title: "床垫深度清洗除菌【1小时】",   price: "169元/次", image: listImageFromHome3("床垫深度清洗除菌【1小时】", images.svcMattress) },
          { id: 55, category: "沙发清洗",   title: "布艺/皮质沙发清洗【1小时】", price: "179元/次", image: listImageFromHome3("布艺/皮质沙发清洗【1小时】", images.svcSofa) },
          { id: 56, category: "窗帘清洁",   title: "窗帘清洁养护【1小时】",       price: "129元/次", image: listImageFromHome3("窗帘清洁养护【1小时】", images.svcDeepClean) },
          { id: 57, category: "地毯清洗",   title: "地毯深度清洗【1小时】",       price: "159元/次", image: listImageFromHome3("地毯深度清洗【1小时】", images.svcCarpet) },
          { id: 58, category: "地板打蜡",   title: "地板打蜡养护【1小时】",       price: "149元/次", image: listImageFromHome3("地板打蜡养护【1小时】", images.svcFloor) },
          { id: 59, category: "大理石抛光", title: "大理石抛光养护【2小时】",     price: "229元/次", image: listImageFromHome3("大理石抛光养护【2小时】", images.svcFloor) }
        ]
      },
      baby_home: {
        title: "宝宝家事",
        categories: ["热门服务", "孩子接送", "陪读辅导", "起居照顾", "育儿嫂"],
        priceUnit: "次",
        services: [
          { id: 61, category: "孩子接送", title: "校区接送小孩【1小时】",     price: "39元/次",  image: listImageFromHome3("校区接送小孩【1小时】", images.svcKids) },
          { id: 62, category: "陪读辅导", title: "课后陪读辅导【2小时】",     price: "89元/次",  image: listImageFromHome3("课后陪读辅导【2小时】", images.svcKids) },
          { id: 63, category: "起居照顾", title: "儿童起居照顾【2小时】",     price: "99元/次",  image: listImageFromHome3("儿童起居照顾【2小时】", images.svcBaby) },
          { id: 64, category: "育儿嫂",   title: "专业育儿嫂上门【3小时】",   price: "199元/次", image: listImageFromHome3("专业育儿嫂上门【3小时】", images.svcBaby) }
        ]
      },
      house_repair: {
        title: "房屋修缮",
        categories: ["热门服务", "岩板修复", "瓷砖修复", "瓷砖铺贴", "壁纸铺贴", "漏水防水", "地板铺贴", "墙面刷新", "墙面修补"],
        priceUnit: "次",
        services: [
          { id: 71, category: "岩板修复", title: "岩板破损修复【1小时】",       price: "199元/次", image: listImageFromHome3("岩板破损修复【1小时】", images.svcTile) },
          { id: 72, category: "瓷砖修复", title: "瓷砖裂纹修复【1小时】",       price: "159元/次", image: listImageFromHome3("瓷砖裂纹修复【1小时】", images.svcTile) },
          { id: 73, category: "瓷砖铺贴", title: "局部瓷砖铺贴【2小时】",       price: "229元/次", image: listImageFromHome3("局部瓷砖铺贴【2小时】", images.svcTile) },
          { id: 74, category: "壁纸铺贴", title: "壁纸铺贴施工【2小时】",       price: "239元/次", image: listImageFromHome3("壁纸铺贴施工【2小时】", images.svcWall) },
          { id: 75, category: "漏水防水", title: "厨卫漏水防水修缮【2小时】",   price: "299元/次", image: listImageFromHome3("厨卫漏水防水修缮【2小时】", images.svcWaterproof) },
          { id: 76, category: "地板铺贴", title: "地板铺贴修缮【2小时】",       price: "279元/次", image: listImageFromHome3("地板铺贴修缮【2小时】", images.svcFloor) },
          { id: 77, category: "墙面刷新", title: "墙面刷新施工【2小时】",       price: "259元/次", image: listImageFromHome3("墙面刷新施工【2小时】", images.svcWall) },
          { id: 78, category: "墙面修补", title: "墙面修补刷新【2小时】",       price: "269元/次", image: listImageFromHome3("墙面修补刷新【2小时】", images.svcWall) }
        ]
      },
      beauty_home: {
        title: "上门美业",
        categories: ["热门服务", "上门纹绣", "上门美容", "化妆造型", "上门美甲", "上门美瞳", "上门美发"],
        priceUnit: "次",
        services: [
          { id: 81, category: "上门纹绣", title: "上门纹绣咨询与设计【1小时】", price: "299元/次", image: listImageFromHome3("上门纹绣咨询与设计【1小时】", images.svcMakeup) },
          { id: 82, category: "上门美容", title: "上门面部护理美容【1小时】",   price: "169元/次", image: listImageFromHome3("上门面部护理美容【1小时】", images.svcMakeup) },
          { id: 83, category: "化妆造型", title: "活动化妆造型【1小时】",       price: "199元/次", image: listImageFromHome3("活动化妆造型【1小时】", images.svcMakeup) },
          { id: 84, category: "上门美甲", title: "上门美甲基础款【1小时】",     price: "129元/次", image: listImageFromHome3("上门美甲基础款【1小时】", images.svcNail) },
          { id: 85, category: "上门美瞳", title: "上门美瞳搭配服务【1小时】",   price: "159元/次", image: listImageFromHome3("上门美瞳搭配服务【1小时】", images.svcMakeup) },
          { id: 86, category: "上门美发", title: "上门美发造型服务【1小时】",   price: "189元/次", image: listImageFromHome3("上门美发造型服务【1小时】", images.svcHair) }
        ]
      }
    };
    return allConfigs[key] || allConfigs.tidy;
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync();
    const key = (options && options.key) || "tidy";
    this._groupKey = key;
    const config = this.getPageConfig(key);

    const icons = [
      '/img/index/menuicon1.png',
      '/img/index/menuicon2.png',
      '/img/index/menuicon3.png',
      '/img/index/menuicon4.png'
    ];

    // 立即用本地数据渲染（无需等待网络）
    const categories = config.categories.map((name, idx) => ({
      key: idx === 0 ? "hot" : name,
      name,
      icon: icons[idx % icons.length]
    }));
    const services = config.services.map((item) => this.decorateService(item));

    this.setData({
      navTopPadding: (sys.statusBarHeight || 20) + 6,
      pageTitle: config.title,
      categories,
      services,
      loading: true
    });
    this.filterServices("hot");

    // [后端接口暂未实现且返回测试脏数据，暂时禁用覆盖，使用本地配置数据]
    this.setData({ loading: false });
  },

  decorateService(item) {
    const unsupported = this.isServiceUnsupported(item);
    return {
      ...item,
      sold: item.sold || "已售0 好评率100%",
      image: item.image || images.homeCleaning,
      unsupported,
      saleStatusText: unsupported ? '不可提供' : ''
    };
  },

  getCurrentCommunityId() {
    const gd = getApp().globalData || {};
    return toNumberOrNull(
      gd.communityId || gd.community_id || wx.getStorageSync('community_id') || wx.getStorageSync('communityId')
    );
  },

  isServiceUnsupported(item) {
    if (!item || typeof item !== 'object') return false;
    if (item.community_supported === false) return true;
    if (item.supported === false || item.is_available === false) return true;
    const communityId = this.getCurrentCommunityId();
    const allow = Array.isArray(item.supported_community_ids) ? item.supported_community_ids : item.supportedCommunityIds;
    if (Array.isArray(allow) && allow.length > 0 && communityId != null) {
      const allowSet = allow.map((x) => Number(x)).filter((x) => Number.isFinite(x));
      if (allowSet.length > 0 && !allowSet.includes(communityId)) return true;
    }
    const deny = Array.isArray(item.blocked_community_ids) ? item.blocked_community_ids : item.blockedCommunityIds;
    if (Array.isArray(deny) && deny.length > 0 && communityId != null) {
      const denySet = deny.map((x) => Number(x)).filter((x) => Number.isFinite(x));
      if (denySet.includes(communityId)) return true;
    }
    return false;
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  },

  switchCategory(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeCategory: key });
    this.filterServices(key);
  },

  filterServices(key) {
    const services = this.data.services;
    if (key === "hot") {
      this.setData({ filteredServices: services });
      return;
    }
    this.setData({ filteredServices: services.filter(item => item.category === key) });
  },

  goServiceDetail(e) {
    if (e.currentTarget.dataset.unsupported) {
      wx.showToast({ title: '当前小区暂不支持该服务', icon: 'none' });
      return;
    }
    const key = this._groupKey || 'tidy';
    const sid = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../service/service?id=${sid}&group_key=${encodeURIComponent(key)}`
    });
  }
});
