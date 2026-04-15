require('dotenv').config();
const { sequelize } = require('./src/models');

sequelize.query("UPDATE Messages SET content = '/img/placeholders/home_cleaning.png' WHERE content LIKE '%unsplash%'").then(() => {
    console.log('Images fixed');
    process.exit(0);
}).catch(console.error);
