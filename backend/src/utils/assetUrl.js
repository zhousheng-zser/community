function toAbsoluteAssetUrl(url, req) {
  if (url == null || url === '') return '';
  const s = String(url).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const base = (process.env.ASSET_BASE_URL || process.env.API_BASE_URL || '').replace(/\/$/, '');
  if (base) return `${base}${s.startsWith('/') ? s : `/${s}`}`;
  if (req && req.protocol && typeof req.get === 'function') {
    const host = req.get('host');
    if (host) return `${req.protocol}://${host}${s.startsWith('/') ? s : `/${s}`}`;
  }
  return s;
}

module.exports = { toAbsoluteAssetUrl };
