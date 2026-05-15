/**
 * 将 GET /core/home-modules 的 modules 转为首页 categoryList 行（icon 仍为相对路径，由页面侧 imgUrl 映射）
 */
function sortModulesStable(list) {
  return [...list].sort((a, b) => {
    const sa = Number(a.sort);
    const sb = Number(b.sort);
    const aOk = !Number.isNaN(sa);
    const bOk = !Number.isNaN(sb);
    if (aOk && bOk && sa !== sb) return sa - sb;
    if (aOk && !bOk) return -1;
    if (!aOk && bOk) return 1;
    return 0;
  });
}

function mapRawModulesToCategoryRows(modules) {
  if (!Array.isArray(modules) || modules.length === 0) return [];
  return sortModulesStable(modules)
    .map((m) => {
      if (!m || typeof m !== 'object') return null;
      const groupKey = String(m.group_key || m.groupKey || '').trim();
      const name = m.name != null ? String(m.name).trim() : '';
      if (!groupKey || !name) return null;
      const rawUrl = m.url != null ? String(m.url).trim() : '';
      const url =
        rawUrl ||
        `../tidy-service/tidy-service?key=${encodeURIComponent(groupKey)}`;
      return {
        groupKey,
        name,
        icon: m.icon != null ? String(m.icon) : '',
        emoji: m.emoji != null ? String(m.emoji) : '📌',
        bgColor: (m.bg_color != null && String(m.bg_color).trim()) || (m.bgColor != null && String(m.bgColor).trim()) || '#fff5eb',
        url
      };
    })
    .filter(Boolean);
}

module.exports = {
  mapRawModulesToCategoryRows
};
