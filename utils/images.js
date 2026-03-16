/**
 * 静态图片资源映射
 *
 * 规则：
 *  - 后端已上传文件 → 使用 base + /uploads/... 路径
 *  - 其余场景图 → 使用 Unsplash CDN 固定 photo ID（永久稳定，免费商用）
 *    格式：https://images.unsplash.com/photo-{ID}?auto=format&fit=crop&w={W}&q=80
 */
const config = require('./config.js');
const base = config.imageBaseUrl;

// ─── Unsplash 图片辅助函数 ───────────────────────────────────────────────────
const usp = (id, w = 600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const images = {
  // ── 后端已上传文件（服务器原路径）──────────────────────────────────────────
  homeCleaning: base + '/uploads/file-1773395942165-45947155.png',
  saleBanner:   base + '/uploads/file-1773395942500-585304598.png',
  avatarWorker: base + '/uploads/file-1773395942842-959042242.png',
  defaultHead:  base + '/uploads/file-1773395943186-905167166.jpg',

  // ── 首页 Banner ────────────────────────────────────────────────────────────
  // 温馨客厅沙发场景 / 现代整洁家居
  bannerHome:    usp('1555041469-9dba582ba7d7', 800),
  bannerSale:    usp('1558618666-fcd25c85cd64', 800),

  // ── 9 大服务分类主图 ────────────────────────────────────────────────────────
  // 整理收纳：整洁衣橱收纳
  catTidy:         usp('1558618666-fcd25c85cd64'),
  // 家修急事：工具箱 & 修缮工人
  catUrgentFix:    usp('1581578731548-c64695cc6952'),
  // 家电清洗：洗衣机特写
  catApplianceClean: usp('1626806819282-2fe86b6d603d'),
  // 开荒保洁：拖地 / 清洁场景
  catPioneerClean: usp('1527515637462-cff94eecc1ac'),
  // 除螨服务：白色整洁床铺
  catMiteRemove:   usp('1631049307264-da0ec9d70304'),
  // 家具养护：实木地板 / 沙发养护
  catFurnitureCare: usp('1555041469-9dba582ba7d7'),
  // 宝宝家事：温馨儿童房
  catBabyHome:     usp('1515488042361-ee00e41b4819'),
  // 房屋修缮：装修施工场景
  catHouseRepair:  usp('1504307651254-35680f356dfd'),
  // 上门美业：美甲 / 化妆场景
  catBeautyHome:   usp('1522335789203-aabd1fc54bc9'),

  // ── 服务详情 Banner（分类级复用）──────────────────────────────────────────
  // 衣橱 / 厨房整理
  svcTidyCloset:   usp('1558618666-fcd25c85cd64'),
  svcTidyKitchen:  usp('1556909114-f6e7ad7d3136'),
  svcTidyPacking:  usp('1600585154340-be6161a56a0c'),
  svcTidyFullRoom: usp('1493663284031-b7e3aaa9f3b5'),
  // 维修类
  svcRepairWater:  usp('1504328345606-18bbc8c9d7d1'),
  svcRepairElec:   usp('1621905251189-8f63c0636e96'),
  svcRepairGeneral: usp('1581578731548-c64695cc6952'),
  // 家电清洗
  svcAircon:       usp('1563453392212-326f5e854473'),
  svcWasher:       usp('1626806819282-2fe86b6d603d'),
  svcHood:         usp('1556909119-cec1500ad303'),
  svcFridge:       usp('1584568694244-14fbdf83bd30'),
  // 开荒保洁
  svcDeepClean:    usp('1527515637462-cff94eecc1ac'),
  // 除螨
  svcMattress:     usp('1631049307264-da0ec9d70304'),
  // 家具养护
  svcFloor:        usp('1554995207-c18c203602cb'),
  svcSofa:         usp('1555041469-9dba582ba7d7'),
  svcCarpet:       usp('1558882932-8da9e3e9c04b'),
  // 宝宝家事
  svcBaby:         usp('1515488042361-ee00e41b4819'),
  svcKids:         usp('1503454537195-1dcabb73ffb9'),
  // 房屋修缮
  svcTile:         usp('1504307651254-35680f356dfd'),
  svcWall:         usp('1589939705384-5185137a7f0f'),
  svcWaterproof:   usp('1584622781564-1d987f7333c1'),
  // 美业
  svcNail:         usp('1604654894610-df63bc536371'),
  svcMakeup:       usp('1522335789203-aabd1fc54bc9'),
  svcHair:         usp('1560869713-7d0a29430803'),

  // ── 小区热卖榜 / 直约服务商 ────────────────────────────────────────────────
  hotWasher:    usp('1626806819282-2fe86b6d603d', 400),
  hotHeater:    usp('1584568694244-14fbdf83bd30', 400),
  hotHood:      usp('1556909119-cec1500ad303', 400),
  hotClean:     usp('1527515637462-cff94eecc1ac', 400),

  // ── 管家精选商品 ────────────────────────────────────────────────────────────
  goodsSkincare1: usp('1556228720-195a672e8a03', 400),
  goodsSkincare2: usp('1512207736890-6ffed8a84e8d', 400),
  goodsLocal:     usp('1506807803488-c8741e10d0a5', 400),

  // ── 家推 / 带货商品 ────────────────────────────────────────────────────────
  pushFood1:    usp('1504674900247-0877df9cc836', 400),
  pushFood2:    usp('1498837167922-ddd27525d352', 400),
  pushDaily1:   usp('1583947215259-255857837bc1', 400),
  pushDaily2:   usp('1556228453-efd6c1ff04f6', 400),
  pushFashion1: usp('1523275335684-37898b6baf30', 400),
  pushBeauty1:  usp('1522335789203-aabd1fc54bc9', 400),

  // ── 直播封面 ────────────────────────────────────────────────────────────────
  liveBeef:     usp('1504674900247-0877df9cc836', 500),
  liveLocal:    usp('1506807803488-c8741e10d0a5', 500),

  // ── 便捷方法：根据原始本地路径返回服务器/CDN 地址 ──────────────────────────
  resolve(localPath) {
    const map = {
      '/img/placeholders/home_cleaning.png':               images.homeCleaning,
      '/img/placeholders/sale_banner.png':                 images.saleBanner,
      '/img/placeholders/avatar_worker.png':               images.avatarWorker,
      '/img/placeholders/avatar_worker_1772546547875.png': images.avatarWorker,
      '/img/head.jpg':                                     images.defaultHead,
    };
    return map[localPath] || localPath;
  }
};

module.exports = images;
