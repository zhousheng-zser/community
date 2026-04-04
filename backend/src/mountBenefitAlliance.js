/**
 * 将惠民卡（京东 / 拼多多 / 顶栏）路由挂到已有 Express `app` 上。
 * 用于与线上一体化「社区 API」同进程部署（该主服务代码若不在本仓库，需在对方 app.listen 前 require 本文件）。
 *
 * @param {import('express').Express} app
 * @param {{ includeMeta?: boolean }} [opts]
 */
function mountBenefitAllianceRoutes(app, opts = {}) {
  const includeMeta = opts.includeMeta !== false;
  const jdBenefitRouter = require('./routes/jdBenefit');
  const pddBenefitRouter = require('./routes/pddBenefit');
  const benefitDisplayRouter = require('./routes/benefitDisplay');

  if (includeMeta) {
    app.get('/api/v1/meta', (req, res) => {
      res.json({
        service: 'community-backend',
        benefit: true,
        routes: [
          'GET /api/v1/meta',
          'GET /api/v1/jd/benefit/goods',
          'GET /api/v1/pdd/benefit/goods',
          'GET /api/v1/benefit/display'
        ]
      });
    });
  }

  app.use('/api/v1/jd', jdBenefitRouter);
  app.use('/api/v1/pdd', pddBenefitRouter);
  app.use('/api/v1/benefit', benefitDisplayRouter);
}

module.exports = mountBenefitAllianceRoutes;
