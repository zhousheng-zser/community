'use strict';

/** 静态资源公网根地址，小程序须用完整 URL 加载 /uploads、/img */
function resolveAssetBase(req) {
  const fromEnv = process.env.PUBLIC_ASSET_BASE || process.env.ASSET_BASE_URL || '';
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim().replace(/\/$/, '');
  }
  if (!req) return '';
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
  const host = (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();
  if (!host) return '';
  return `${proto}://${host}`;
}

function toAbsoluteAssetUrl(req, url) {
  if (url == null || url === '') return null;
  const u = String(url).trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  const base = resolveAssetBase(req);
  if (!base) return u;
  return base + (u.startsWith('/') ? u : `/${u}`);
}

module.exports = { resolveAssetBase, toAbsoluteAssetUrl };
