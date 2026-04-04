require('dotenv').config();
const app = require('./app');
const { sequelize, JdBenefitGood, PddBenefitGood, BenefitAllianceConfig } = require('./jd');

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  try {
    await sequelize.authenticate();
    if (process.env.DB_SYNC_JD === 'true' || process.env.DB_SYNC_JD === '1') {
      await JdBenefitGood.sync({ alter: true });
      console.log('[db] JdBenefitGood synced (alter=true)');
    }
    if (process.env.DB_SYNC_PDD === 'true' || process.env.DB_SYNC_PDD === '1') {
      await PddBenefitGood.sync({ alter: true });
      console.log('[db] PddBenefitGood synced (alter=true)');
    }
    if (process.env.DB_SYNC_BENEFIT === 'true' || process.env.DB_SYNC_BENEFIT === '1') {
      await BenefitAllianceConfig.sync({ alter: true });
      console.log('[db] BenefitAllianceConfig synced (alter=true)');
    }
  } catch (e) {
    console.error('[db] connect/sync failed:', e.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Listening on http://0.0.0.0:${PORT}`);
    console.log(
      `Benefit: GET /api/v1/benefit/display  JD goods: /api/v1/jd/benefit/goods  PDD: /api/v1/pdd/benefit/goods`
    );
  });
}

bootstrap();
