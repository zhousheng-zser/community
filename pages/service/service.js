const util = require('../../utils/util.js');
const { imgUrl } = util;
const images = require('../../utils/images.js');
const { buildServiceMockMap } = require('../../utils/serviceMockData.js');
const { listImageFromHome3, home3PathForTitle } = require('../../utils/serviceHome3.js');
const browseFootprint = require('../../utils/browseFootprint.js');
const serviceFavStore = require('../../utils/serviceFavStore.js');

Page({
  data: {
    navTopPadding: 20,
    serviceId: 1,
    workerId: null,
    groupKey: '',
    service: {},
    specs: [],
    detailImages: [],
    descText: "",
    favorited: false
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
        const apiBanner = imgUrl(res.cover_image || res.banner || 'https://jshsp1.eds-tech.cn/uploads/file-1773395942165-45947155.png');
        let imgs = (Array.isArray(detailImages) ? detailImages : []).map((p) => imgUrl(p));
        const home3 = home3PathForTitle(title);
        if (home3) {
          const h3u = imgUrl(home3);
          imgs = [h3u, ...imgs.filter((u) => u !== h3u)];
        }
        const apiId = res.id != null ? Number(res.id) : id;
        service = {
          id: apiId,
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
    } catch (e) { }

    service = service || mockMap[id] || mockMap[1];
    const resolvedServiceId =
      (service && service.id != null && Number(service.id) > 0)
        ? Number(service.id)
        : Number(this.data.serviceId);
    this.setData({
      serviceId: Number.isFinite(resolvedServiceId) ? resolvedServiceId : this.data.serviceId,
      service,
      specs: [service.spec],
      detailImages: service.detailImages,
      descText: service.desc
    });
    try {
      const sid = Number.isFinite(resolvedServiceId) ? resolvedServiceId : Number(this.data.serviceId);
      if (!sid) return;
      let url = `/pages/service/service?id=${encodeURIComponent(String(sid))}`;
      if (this.data.workerId != null) url += `&worker_id=${encodeURIComponent(String(this.data.workerId))}`;
      if (this.data.groupKey) url += `&group_key=${encodeURIComponent(this.data.groupKey)}`;
      const wPart = this.data.workerId != null ? `_${this.data.workerId}` : '';
      const gPart = this.data.groupKey ? `_${this.data.groupKey}` : '';
      browseFootprint.record({
        kind: 'service',
        dedupeKey: `service:${sid}${wPart}${gPart}`,
        title: (service && service.title) || '服务',
        cover: (service && service.banner) || '',
        url
      });
    } catch (e) { }

    this.setData({ favorited: serviceFavStore.has('service', this.data.serviceId) });
  },

  onShow() {
    if (this.data.serviceId) {
      this.setData({ favorited: serviceFavStore.has('service', this.data.serviceId) });
    }
  },

  toggleFavorite() {
    const svc = this.data.service || {};
    const sid = this.data.serviceId;
    let url = `/pages/service/service?id=${encodeURIComponent(String(sid))}`;
    if (this.data.workerId != null) url += `&worker_id=${encodeURIComponent(String(this.data.workerId))}`;
    if (this.data.groupKey) url += `&group_key=${encodeURIComponent(this.data.groupKey)}`;
    const now = serviceFavStore.toggle({
      kind: 'service',
      id: sid,
      title: svc.title || '服务',
      cover: svc.banner || '',
      price: svc.price != null ? String(svc.price) : '',
      url
    });
    this.setData({ favorited: now });
    wx.showToast({ title: now ? '已收藏' : '已取消收藏', icon: 'none' });
  },
  orderConfrim() {
    if (!wx.getStorageSync('token')) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再下单',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/login/login' });
        }
      });
      return;
    }
    const sid = Number(this.data.serviceId);
    if (!Number.isFinite(sid) || sid <= 0) {
      wx.showToast({ title: '服务暂不可下单，请稍后再试', icon: 'none' });
      return;
    }
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
    let url = `../order-confrim/order-confrim?name=${encodeURIComponent(name)}&sub=${encodeURIComponent(sub)}&price=${encodeURIComponent(price)}&image=${encodeURIComponent(image)}&serviceId=${sid}`;
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
