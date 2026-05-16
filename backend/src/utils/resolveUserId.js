/**
 * 从 JWT / req.user 解析用户主键（雪花 id 必须用字符串，禁止 Number 转换）
 */
function resolveUserId(raw) {
  if (raw == null || raw === '') return null;
  const id = String(raw).trim();
  if (!id) return null;
  if (!/^\d+$/.test(id)) return null;
  return id;
}

module.exports = { resolveUserId };
