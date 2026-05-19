const { Client } = require('ssh2');
const cl = new Client();
cl.on('ready', () => {
  cl.exec('find /root/community-backend -name "ServiceOrder.js" 2>/dev/null | head -5', (e, s) => {
    s.on('data', x => process.stdout.write(x));
    s.on('close', () => cl.end());
  });
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
