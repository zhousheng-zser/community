const { Client } = require('ssh2');
const cl = new Client();
cl.on('ready', () => {
  cl.exec(`cd /root/community-backend/backend && NODE_ENV=production timeout 8 node src/index.js 2>&1 | head -50`, (e, s) => {
    s.on('data', (x) => process.stdout.write(x));
    s.stderr.on('data', (x) => process.stderr.write(x));
    s.on('close', () => {
      cl.exec('tail -50 /tmp/community-backend.log 2>/dev/null; lsof -i :3001 -i :3002 2>/dev/null | head -10', (e2, s2) => {
        s2.on('data', (x) => process.stdout.write(x));
        s2.on('close', () => cl.end());
      });
    });
  });
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
