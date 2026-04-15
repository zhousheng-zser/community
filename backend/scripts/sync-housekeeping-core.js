require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const db = require('../src/models');

async function backfillWorkerProfiles() {
  const rows = await db.WorkerApplication.findAll({ where: { status: 'approved' }, order: [['updated_at', 'DESC']] });
  for (const row of rows) {
    await db.WorkerProfile.upsert({
      user_id: row.user_id,
      application_id: row.id,
      real_name: row.name,
      phone: row.phone,
      industry: row.industry,
      education: row.education || null,
      city: row.city || null,
      resume: row.resume || null,
      id_card_url: row.id_card_url,
      work_photo_url: row.work_photo_url || null,
      certificate_url: row.certificate_url || null,
      status: 'active'
    });
    const user = await db.User.findByPk(row.user_id);
    if (user) {
      user.role = 'worker';
      if (!user.phone && row.phone) user.phone = row.phone;
      if (!user.nickname && row.name) user.nickname = row.name;
      await user.save();
    }
  }
}

async function backfillServiceProviderProfiles() {
  const rows = await db.ServiceProviderApplication.findAll({ where: { status: 'approved' }, order: [['created_at', 'DESC']] });
  for (const row of rows) {
    await db.ServiceProviderProfile.upsert({
      user_id: row.user_id,
      application_id: row.id,
      shop_name: row.shop_name,
      contact_name: row.contact_name,
      phone: row.phone,
      license_url: row.license_url,
      shop_front_url: row.shop_front_url || null,
      environment_url: row.environment_url || null,
      id_card_url: row.id_card_url,
      certificate_url: row.certificate_url || null,
      status: 'active'
    });
    const user = await db.User.findByPk(row.user_id);
    if (user && !user.phone && row.phone) {
      user.phone = row.phone;
      await user.save();
    }
  }
}

async function main() {
  await db.sequelize.authenticate();
  await db.WorkerProfile.sync();
  await db.ServiceProviderProfile.sync();
  await db.HousekeepingDispatch.sync();
  await backfillWorkerProfiles();
  await backfillServiceProviderProfiles();
  console.log('worker_profiles, service_provider_profiles, housekeeping_dispatches synced and backfilled');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
