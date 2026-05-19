const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

function run(cl, cmd) {
  return new Promise((resolve, reject) => {
    cl.exec(cmd, (e, s) => {
      if (e) return reject(e);
      let out = '';
      s.on('data', x => { out += x; process.stdout.write(x); });
      s.stderr.on('data', x => process.stderr.write(x));
      s.on('close', () => resolve(out));
    });
  });
}

const cl = new Client();
cl.on('ready', () => {
  const localPy = path.join(__dirname, 'patch_login_sms_remote.py');
  const remotePy = '/tmp/patch_login_sms.py';
  cl.sftp((err, sftp) => {
    if (err) {
      console.error(err);
      cl.end();
      return;
    }
    sftp.fastPut(localPy, remotePy, async (e2) => {
      if (e2) {
        console.error(e2);
        cl.end();
        return;
      }
      await run(cl, `python3 ${remotePy}`);
      await run(cl, 'cd /root/community-backend/backend && pm2 list');
      await run(cl, 'cd /root/community-backend/backend && (pm2 restart ecosystem.config.js 2>/dev/null || pm2 restart all || node src/server.js &)');
      await new Promise(r => setTimeout(r, 4000));
      await run(cl, `curl -sk -m 8 -X POST https://127.0.0.1:3001/api/v1/auth/login_sms -H "Content-Type: application/json" -d '{"phone":"13800001111","code":"123456"}'`);
      cl.end();
    });
  });
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
