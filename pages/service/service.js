const util = require('../../utils/util.js');
const { imgUrl } = util;

Page({
  data: {
    navTopPadding: 20,
    serviceId: 1,
    service: {},
    specs: [],
    detailImages: [],
    descText: ""
  },
  async onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 6 });
    const id = Number(options.id || 1);
    this.setData({ serviceId: id });
    const mockMap = {
      1: {
        title: "住院探视护理（预约）",
        subTitle: "住院探视护理（预约）",
        price: 0,
        banner: imgUrl("/img/placeholders/home_cleaning.png"),
        tags: ["无额外收费", "未服务随时退", "不满意重服务"],
        spec: "住院探视护理（预约）",
        desc: "本次支付费用不包含医疗耗材，如您无法提供相关医疗耗材，可联系我们服务人员，由上门护士提供，费用需自理。",
        detailImages: [
          imgUrl("/img/placeholders/home_cleaning.png"),
          imgUrl("/img/placeholders/home_cleaning.png")
        ]
      },
      2: {
        title: "【初开荒】60平以内含擦窗、除胶点漆点",
        subTitle: "【初开荒】60平以内 含擦窗、除胶点漆点",
        price: 480,
        banner: imgUrl("/img/placeholders/home_cleaning.png"),
        tags: ["无额外收费", "未服务随时退", "不满意重服务"],
        spec: "【初开荒】60平以内含擦窗、除胶点漆点",
        desc: "家政开荒保洁服务，按面积与难度报价，包含客厅、卧室、厨卫基础清洁。",
        detailImages: [
          imgUrl("/img/placeholders/home_cleaning.png"),
          imgUrl("/img/placeholders/home_cleaning.png"),
          imgUrl("/img/placeholders/home_cleaning.png")
        ]
      },
      1001: {
        title: "衣橱整理收纳（2小时）",
        subTitle: "衣橱整理收纳（2小时）",
        price: 196,
        banner: imgUrl("/img/placeholders/home_cleaning.png"),
        tags: ["标准计时", "专业整理", "不满意重服务"],
        spec: "2小时/份",
        desc: "包含衣橱分类、折叠、收纳布局优化与简单清洁。",
        detailImages: [imgUrl("/img/placeholders/home_cleaning.png")]
      },
      1002: {
        title: "羽绒服/大衣（任意2件）",
        subTitle: "羽绒服/大衣（任意2件）",
        price: 79,
        banner: imgUrl("/img/placeholders/home_cleaning.png"),
        tags: ["上门取送", "专业洗护", "不满意重洗"],
        spec: "2件/份",
        desc: "包含上门取送、专业洗护、简单包装交付。",
        detailImages: [imgUrl("/img/placeholders/home_cleaning.png")]
      },
      1003: {
        title: "马桶疏通",
        subTitle: "马桶疏通",
        price: 158,
        banner: imgUrl("/img/placeholders/home_cleaning.png"),
        tags: ["上门服务", "专业工具", "不通不收"],
        spec: "1次/洞",
        desc: "适用于马桶堵塞疏通，轻度重度堵塞按现场情况处理。",
        detailImages: [imgUrl("/img/placeholders/home_cleaning.png")]
      }
    };

    let service = null;
    try {
      const res = await util.get(`core/services/${id}`);
      if (res && typeof res === 'object') {
        const detailImages = Array.isArray(res.detail_images)
          ? res.detail_images
          : (typeof res.detail_images === 'string' ? JSON.parse(res.detail_images || '[]') : []);
        service = {
          title: res.title || res.name || "",
          subTitle: res.sub_title || res.title || res.name || "",
          price: res.price,
          banner: imgUrl(res.cover_image || res.banner || "/img/placeholders/home_cleaning.png"),
          tags: Array.isArray(res.tags) ? res.tags : ["无额外收费", "未服务随时退", "不满意重服务"],
          spec: res.spec || (res.title || res.name || ""),
          desc: res.description || res.desc || "",
          detailImages: (Array.isArray(detailImages) ? detailImages : []).map(p => imgUrl(p))
        };
      }
    } catch (e) {}

    service = service || mockMap[id] || mockMap[1];
    this.setData({
      service,
      specs: [service.spec],
      detailImages: service.detailImages,
      descText: service.desc
    });
  },
  orderConfrim() {
    const svc = this.data.service || {};
    const name = svc.title || '';
    const sub = svc.subTitle || name;
    const rawPrice = svc.price;
    let price = '0';
    if (typeof rawPrice === 'number' && Number.isFinite(rawPrice)) {
      price = String(rawPrice);
    } else if (typeof rawPrice === 'string') {
      const m = rawPrice.match(/[\d.]+/);
      price = m ? m[0] : '0';
    }
    const image = svc.banner || '';
    wx.navigateTo({
      url: `../order-confrim/order-confrim?name=${encodeURIComponent(name)}&sub=${encodeURIComponent(sub)}&price=${encodeURIComponent(price)}&image=${encodeURIComponent(image)}`
    });
  },
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  }
});
