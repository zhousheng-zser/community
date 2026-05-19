const { Client } = require('ssh2');
const cl = new Client();
cl.on('ready', () => {
  cl.exec('head -30 /root/community-backend/backend/src/routes/serviceOrderRoutes.js', (e, s) => {
    s.on('data', x => process.stdout.write(x));
    s.on('close', () => cl.end());
  });
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
