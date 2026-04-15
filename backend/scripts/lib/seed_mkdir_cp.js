'use strict';
/**
 * Seed 用：从扁平 market 示例文件复制到目标 URL 对应磁盘路径（mkdir -p + cp）。
 * destUrl 形如 /uploads/market/...
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'data', 'uploads', 'images');

function urlToAbs(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) return null;
  return path.join(UPLOAD_ROOT, url.slice('/uploads/'.length).split('/').join(path.sep));
}

/** @param {string} destUrl 目标 /uploads/... @param {string} legacyRelative 相对 images 根，如 market/foo.jpg */
function mkdirCpFromLegacy(destUrl, legacyRelative) {
  const dest = urlToAbs(destUrl);
  const src = path.join(UPLOAD_ROOT, ...legacyRelative.split('/'));
  if (!dest || !fs.existsSync(src)) return false;
  if (fs.existsSync(dest)) return true;
  execFileSync('mkdir', ['-p', path.dirname(dest)], { stdio: 'inherit' });
  execFileSync('cp', [src, dest], { stdio: 'inherit' });
  return true;
}

module.exports = { mkdirCpFromLegacy, UPLOAD_ROOT };
