/**
 * 技工 / 服务商 / 集市商家工作台：头像与封面图上传
 */
const util = require('./util.js');

function extractUploadPath(data) {
  if (!data) return '';
  if (typeof data === 'string') return data.trim();
  return String(data.url || data.path || data.file_url || '').trim();
}

function pickImage() {
  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const path = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (path) resolve(path);
        else reject({ errmsg: '未选择图片' });
      },
      fail: () => reject({ errmsg: '未选择图片' })
    });
  });
}

async function uploadImage(tempPath) {
  const up = await util.uploadFile('upload', tempPath, 'file');
  const raw = extractUploadPath(up);
  if (!raw) throw { errmsg: '上传失败' };
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? raw : `/${raw.replace(/^\/+/, '')}`;
}

function syncGlobalUserPhoto(app, pathOrUrl) {
  const display = util.imgUrl(pathOrUrl, pathOrUrl);
  const a = app || getApp();
  if (a.globalData && a.globalData.user) {
    a.globalData.user.userPhoto = display;
    a.globalData.user.avatar_url = pathOrUrl;
    a.globalData.user.avatarUrl = pathOrUrl;
  }
  return display;
}

async function chooseUploadAndGetPath() {
  const temp = await pickImage();
  wx.showLoading({ title: '上传中', mask: true });
  try {
    return await uploadImage(temp);
  } finally {
    wx.hideLoading();
  }
}

module.exports = {
  extractUploadPath,
  pickImage,
  uploadImage,
  syncGlobalUserPhoto,
  chooseUploadAndGetPath
};
