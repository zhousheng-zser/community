const { Client } = require('ssh2');
const fs = require('fs');
const cl = new Client();
cl.on('ready', () => {
  cl.exec('grep -n "admin_dispatch\\|create\\|paid_pending_dispatch\\|group_key" /root/community-backend/backend/src/controllers/serviceOrderController.js | head -40', (e, s) => {
    s.on('data', x => process.stdout.write(x));
    s.on('close', () => cl.end());
  });
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
