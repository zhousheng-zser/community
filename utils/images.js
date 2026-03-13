/**
 * 服务器静态图片资源映射
 * 所有非基础图标的图片均存储在服务器，通过此文件统一引用
 */
const config = require('./config.js');
const base = config.imageBaseUrl;

const images = {
  // 占位图 / 通用背景图
  homeCleaning: base + '/uploads/file-1773395942165-45947155.png',
  saleBanner:   base + '/uploads/file-1773395942500-585304598.png',
  avatarWorker: base + '/uploads/file-1773395942842-959042242.png',
  defaultHead:  base + '/uploads/file-1773395943186-905167166.jpg',

  // 便捷方法：根据原始路径返回服务器地址
  resolve(localPath) {
    const map = {
      '/img/placeholders/home_cleaning.png':            images.homeCleaning,
      '/img/placeholders/sale_banner.png':              images.saleBanner,
      '/img/placeholders/avatar_worker.png':            images.avatarWorker,
      '/img/placeholders/avatar_worker_1772546547875.png': images.avatarWorker,
      '/img/head.jpg':                                  images.defaultHead,
    };
    return map[localPath] || localPath;
  }
};

module.exports = images;
