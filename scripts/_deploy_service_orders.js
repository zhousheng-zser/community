const { Client } = require('ssh2');
const path = require('path');

const ROOT = '/root/community-backend/backend';
const files = [
  ['backend/src/modules/service-provider-portal/models/ServiceOrder.js', `${ROOT}/src/modules/service-provider-portal/models/ServiceOrder.js`],
  ['backend/src/modules/service-order/controllers/serviceOrder.controller.js', `${ROOT}/src/modules/service-order/controllers/serviceOrder.controller.js`],
  ['backend/src/modules/service-order/controllers/adminDispatch.controller.js', `${ROOT}/src/modules/service-order/controllers/adminDispatch.controller.js`],
  ['backend/src/modules/service-order/routes.js', `${ROOT}/src/modules/service-order/routes.js`]
];

const cl = new Client();
cl.on('ready', () => {
  cl.sftp((err, sftp) => {
    if (err) {
      console.error(err);
      cl.end();
      return;
    }
    let i = 0;
    const next = () => {
      if (i >= files.length) {
        const sql = `mysql -u root community -e "ALTER TABLE service_orders ADD COLUMN group_key VARCHAR(64) NULL, ADD COLUMN community_id BIGINT UNSIGNED NULL, ADD COLUMN fulfillment_meta TEXT NULL;" 2>/dev/null; pm2 restart all; sleep 3; curl -sk -m 8 -X POST https://127.0.0.1:3001/api/v1/auth/login_sms -H "Content-Type: application/json" -d '{"phone":"13800001111","code":"123456"}' | head -c 80`;
        cl.exec(sql, (e, s) => {
          s.on('data', (x) => process.stdout.write(x));
          s.stderr.on('data', (x) => process.stderr.write(x));
          s.on('close', () => cl.end());
        });
        return;
      }
      const [local, remote] = files[i++];
      const localPath = path.join(__dirname, '..', local);
      sftp.fastPut(localPath, remote, (e2) => {
        if (e2) console.error('upload fail', local, e2.message);
        else console.log('uploaded', remote);
        next();
      });
    };
    next();
  });
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
