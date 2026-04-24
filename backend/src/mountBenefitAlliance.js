/**
 * 惠民卡联盟：公开 API + 拼多多路由（含推广转链）
 * 主社区进程可 require 本文件并传入 app，在 listen 之前调用。
 */
module.exports = function mountBenefitAlliance(app) {
  app.get('/api/v1/meta', (req, res) => {
    res.json({
      errno: 0,
      data: { benefit: true }
    });
  });

  app.use('/api/v1/benefit', require('./routes/benefitDisplayRoutes'));
  app.use('/api/v1/jd', require('./routes/jdBenefitRoutes'));
  app.use('/api/v1/pdd', require('./routes/pddRoutes'));
};
