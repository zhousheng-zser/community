require('dotenv').config();
const app = require('./app');
const { sequelize, JdBenefitGood } = require('./jd');

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  try {
    await sequelize.authenticate();
    if (process.env.DB_SYNC_JD === 'true' || process.env.DB_SYNC_JD === '1') {
      await JdBenefitGood.sync({ alter: true });
      console.log('[db] JdBenefitGood synced (alter=true)');
    }
  } catch (e) {
    console.error('[db] connect/sync failed:', e.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Listening on http://0.0.0.0:${PORT}`);
    console.log(`JD benefit: GET /api/v1/jd/benefit/goods  GET /api/v1/jd/promotion/spread-url`);
  });
}

bootstrap();
