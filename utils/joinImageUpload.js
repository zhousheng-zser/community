/**
 * 技工 / 服务商 / 集市商家入驻 — 带字段名的图片上传
 */
const util = require('./util.js');

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_MB = 10;

const LABELS = {
  worker: {
    idFront: '身份证人像面',
    workPhoto: '工作生活照',
    cert: '专业证书',
    avatar: '头像'
  },
  service: {
    license: '营业执照',
    shopFront: '门店门头照',
    envPhoto: '店内环境照',
    idCard: '法人身份证',
    cert: '资质证书',
    specialCert: '特殊行业资质证书'
  },
  market: {
    signboard: '品牌Logo',
    indoor: '商家背景图',
    bizLicense: '营业执照/从业资格证',
    placePhoto: '实地照'
  }
};

function labelOf(scene, fieldKey, index) {
  const map = LABELS[scene] || {};
  if (fieldKey === 'placePhoto' && index != null) {
    return `${map.placePhoto || '实地照'}（第${index + 1}张）`;
  }
  return map[fieldKey] || '图片';
}

function formatSizeMb(bytes) {
  if (!bytes || bytes <= 0) return '';
  return `（约 ${(bytes / 1024 / 1024).toFixed(1)}MB）`;
}

function getFileSize(path) {
  return new Promise((resolve) => {
    if (!path) {
      resolve(0);
      return;
    }
    wx.getFileInfo({
      filePath: path,
      success: (res) => resolve(Number(res.size || 0)),
      fail: () => resolve(Number.MAX_SAFE_INTEGER)
    });
  });
}

function compressImage(path, quality) {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: path,
      quality,
      success: (res) => resolve(res.tempFilePath || path),
      fail: reject
    });
  });
}

async function ensureUploadable(path, label) {
  if (!path || /^https?:\/\//i.test(path) || String(path).includes('/uploads/')) {
    return path;
  }
  let current = path;
  let size = await getFileSize(current);
  if (size <= MAX_UPLOAD_BYTES) return current;

  const qualities = [85, 75, 65, 55, 45, 35];
  for (let i = 0; i < qualities.length; i++) {
    try {
      current = await compressImage(current, qualities[i]);
      size = await getFileSize(current);
      if (size <= MAX_UPLOAD_BYTES) return current;
    } catch (e) {
      break;
    }
  }
  const finalSize = await getFileSize(current);
  if (finalSize > MAX_UPLOAD_BYTES) {
    const err = new Error('IMAGE_TOO_LARGE');
    err.errmsg = `「${label}」图片过大${formatSizeMb(finalSize)}，单张不超过${MAX_UPLOAD_MB}MB，请压缩或换一张`;
    err.image_label = label;
    throw err;
  }
  return current;
}

function formatUploadError(err, label) {
  const name = (err && err.image_label) || label || '';
  const prefix = name ? `「${name}」` : '';
  const raw = (err && (err.errmsg || err.msg || err.message)) || '';
  if (/IMAGE_TOO_LARGE/i.test(String(err && err.message)) && err.errmsg) {
    return err.errmsg;
  }
  if (/过大|too large|413|40013|MulterError/i.test(raw)) {
    return `${prefix}图片过大，单张不超过${MAX_UPLOAD_MB}MB，请压缩或换一张`;
  }
  if (/格式|webp|UNSUPPORTED|40014/i.test(raw)) {
    return `${prefix}格式不支持，请使用 jpg/png/webp`;
  }
  if (raw) return raw.startsWith('「') ? raw : `${prefix}${raw}`;
  return `${prefix}上传失败，请重试`;
}

/**
 * @param {'worker'|'service'|'market'} scene
 * @param {string} fieldKey
 * @param {string} path 本地临时路径
 * @param {{ index?: number }} [opts]
 */
async function upload(scene, fieldKey, path, opts) {
  if (!path) return '';
  const s = String(path).trim();
  if (!s) return '';
  if (s.includes('/uploads/')) return s;
  if (/^https?:\/\//i.test(s) && !/\/tmp|temp/i.test(s)) return s;

  const label = labelOf(scene, fieldKey, opts && opts.index);
  let finalPath = await ensureUploadable(s, label);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await util.uploadFile('upload', finalPath, 'file', {
        image_field: fieldKey,
        image_label: label
      });
      if (typeof res === 'string' && res.trim()) return res.trim();
      if (res && res.url) return String(res.url).trim();
      throw { errmsg: `「${label}」上传失败，请重试`, image_label: label };
    } catch (uploadErr) {
      const code = Number(uploadErr && uploadErr.code);
      const msg = String((uploadErr && (uploadErr.msg || uploadErr.errmsg)) || '');
      const raw = String((uploadErr && uploadErr.raw) || '');
      const isTooLarge =
        code === 40013 ||
        uploadErr.statusCode === 413 ||
        /File too large|文件过大|过大/i.test(msg) ||
        /MulterError:\s*File too large/i.test(raw);
      if (!isTooLarge || attempt >= 2) {
        const errmsg = formatUploadError(uploadErr, label);
        throw Object.assign({}, uploadErr, { errmsg, image_label: label });
      }
      try {
        finalPath = await compressImage(finalPath, 30 - attempt * 8);
        finalPath = await ensureUploadable(finalPath, label);
      } catch (compressErr) {
        const errmsg = formatUploadError(compressErr.errmsg ? compressErr : uploadErr, label);
        throw Object.assign({}, uploadErr, { errmsg, image_label: label });
      }
    }
  }
  throw { errmsg: `「${label}」上传失败，请重试`, image_label: label };
}

module.exports = {
  upload,
  labelOf,
  formatUploadError,
  ensureUploadable,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB
};
