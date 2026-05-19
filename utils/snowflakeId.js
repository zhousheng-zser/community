/** 雪花 ID 比较（禁止 Number 转换） */
function asId(v) {
  if (v == null || v === '') return '';
  return String(v).trim();
}

function sameId(a, b) {
  const sa = asId(a);
  const sb = asId(b);
  return !!sa && !!sb && sa === sb;
}

module.exports = { asId, sameId };
