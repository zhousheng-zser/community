const { Client } = require('ssh2');
const fs = require('fs');
const cl = new Client();
cl.on('ready', () => {
  cl.exec('cat /root/community-backend/backend/src/routes/authRoutes.js && echo "---CTRL---" && cat /root/community-backend/backend/src/controllers/authController.js', (e, s) => {
    let out = '';
    s.on('data', x => { out += x; });
    s.on('close', () => {
      fs.writeFileSync('scripts/_server_auth_dump.txt', out);
      cl.end();
    });
  });
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
