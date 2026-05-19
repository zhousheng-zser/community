const { Client } = require('ssh2');
const fs = require('fs');
const cl = new Client();
cl.on('ready', () => {
  cl.exec('cat /root/community-backend/backend/src/models/ServiceOrder.js', (e, s) => {
    let o = '';
    s.on('data', x => { o += x; });
    s.on('close', () => {
      fs.writeFileSync('scripts/_server_ServiceOrder.js', o);
      cl.end();
    });
  });
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
