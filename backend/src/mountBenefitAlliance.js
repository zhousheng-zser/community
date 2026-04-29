module.exports = function mountBenefitAlliance(app) {
  app.get('/api/v1/meta', (req, res) => {
    res.json({ errno: 0, data: { benefit: true } });
  });

  app.use('/api/v1/benefit', require('./routes/benefitDisplayRoutes'));
  app.use('/api/v1/benefit-alliance', require('./routes/benefitAllianceGoodsRoutes'));
  app.use('/api/v1/jd', require('./routes/jdBenefitRoutes'));
  app.use('/api/v1/pdd', require('./routes/pddRoutes'));
};
