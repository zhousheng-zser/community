/**
 * GET /api/v1/admin/system/health
 * 进程与运行环境（只读，便于运维排查）
 */
exports.health = (req, res) => {
  try {
    const mem = process.memoryUsage();
    res.json({
      message: 'ok',
      data: {
        node_version: process.version,
        uptime_seconds: Math.floor(process.uptime()),
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        rss_mb: Math.round(mem.rss / 1024 / 1024),
        platform: process.platform,
        env: process.env.NODE_ENV || 'development'
      }
    });
  } catch (e) {
    res.status(500).json({ error: '读取失败' });
  }
};
