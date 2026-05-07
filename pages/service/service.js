const util = require('../../utils/util.js');
const { imgUrl } = util;
const images = require('../../utils/images.js');
const { buildServiceMockMap } = require('../../utils/serviceMockData.js');
const { listImageFromHome3, home3PathForTitle } = require('../../utils/serviceHome3.js');

Page({
  data: {
    navTopPadding: 20,
    serviceId: 1,
    workerId: null,
    groupKey: '',
    service: {},
    specs: [],
    detailImages: [],
    descText: ""
  },
  async onLoad(options) {
    const sys = wx.getSystemInfoSync();
    this.setData({ navTopPadding: (sys.statusBarHeight || 20) + 6 });
    const id = Number(options.id || 1);
    const workerId =
      options.worker_id != null && options.worker_id !== ''
        ? Number(options.worker_id)
        : null;
    const groupKey = options.group_key ? decodeURIComponent(options.group_key) : '';
    this.setData({
      serviceId: id,
      workerId: Number.isFinite(workerId) ? workerId : null,
      groupKey
    });

    const tagSets = {
      default: ['无额外收费', '未服务随时退', '不满意重服务'],
      tidy: ['标准计时', '专业整理', '不满意重服务'],
      repair: ['上门服务', '专业工具', '不满意不收费'],
      clean: ['专业清洗', '高温除菌', '不满意重洗'],
      beauty: ['上门服务', '专业技师', '不满意重做']
    };
    const mockMap = buildServiceMockMap(images, tagSets);
    Object.keys(mockMap).forEach((k) => {
      const s = mockMap[k];
      s.banner = imgUrl(s.banner);
      s.detailImages = (s.detailImages || []).map((p) => imgUrl(p));
    });

    let service = null;
    try {
      const res = await util.get(`core/services/${id}`);
      if (res && typeof res === 'object') {
        const detailImages = Array.isArray(res.detail_images)
          ? res.detail_images
          : (typeof res.detail_images === 'string' ? JSON.parse(res.detail_images || '[]') : []);
        const title = res.title || res.name || '';
        const apiBanner = imgUrl(res.cover_image || res.banner || '/img/placeholders/home_cleaning.png');
        let imgs = (Array.isArray(detailImages) ? detailImages : []).map((p) => imgUrl(p));
        const home3 = home3PathForTitle(title);
        if (home3) {
          const h3u = imgUrl(home3);
          imgs = [h3u, ...imgs.filter((u) => u !== h3u)];
        }
        service = {
          title,
          subTitle: res.sub_title || res.title || res.name || '',
          price: res.price,
          banner: listImageFromHome3(title, apiBanner),
          tags: Array.isArray(res.tags) ? res.tags : ['无额外收费', '未服务随时退', '不满意重服务'],
          spec: res.spec || (res.title || res.name || ''),
          desc: res.description || res.desc || '',
          detailImages: imgs
        };
      }
    } catch (e) {}

    service = service || mockMap[id] || mockMap[1];
    const resolvedServiceId =
      (service && service.id != null && service.id !== '')
        ? Number(service.id)
        : Number(this.data.serviceId);
    this.setData({
      serviceId: Number.isFinite(resolvedServiceId) ? resolvedServiceId : this.data.serviceId,
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
    let url = `../order-confrim/order-confrim?name=${encodeURIComponent(name)}&sub=${encodeURIComponent(sub)}&price=${encodeURIComponent(price)}&image=${encodeURIComponent(image)}&serviceId=${this.data.serviceId}`;
    if (this.data.workerId != null) {
      url += `&workerId=${this.data.workerId}`;
    }
    if (this.data.groupKey) {
      url += `&groupKey=${encodeURIComponent(this.data.groupKey)}`;
    }
    wx.navigateTo({ url });
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
