const { Client } = require('ssh2');
const cl = new Client();
cl.on('ready', () => {
  cl.exec('grep -r "modelName: .Service" /root/community-backend/backend/src/models 2>/dev/null | head -5', (e, s) => {
    s.on('data', (x) => process.stdout.write(x));
    s.on('close', () => cl.end());
  });
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
