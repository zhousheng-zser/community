require('dotenv').config();
const db = require('./src/models');

db.sequelize.sync({ alter: true }).then(() => {
    console.log('Database tables fully synced!');
    process.exit(0);
}).catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
});
