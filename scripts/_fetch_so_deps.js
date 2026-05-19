const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const files = [
  'src/controllers/servicePaymentController.js',
  'src/utils/serviceOrderPaidTransition.js',
  'src/utils/serviceProviderOrderScope.js',
  'src/models/ServiceOrder.js',
  'src/models/Service.js'
];
const cl = new Client();
cl.on('ready', () => {
  let i = 0;
  const next = () => {
    if (i >= files.length) { cl.end(); return; }
    const rel = files[i++];
    cl.exec(`cat /root/community-backend/backend/${rel} 2>/dev/null || echo MISSING`, (e, s) => {
      let o = '';
      s.on('data', (x) => { o += x; });
      s.on('close', () => {
        if (!o.startsWith('MISSING')) {
          const p = path.join(__dirname, '..', 'backend', rel);
          fs.mkdirSync(path.dirname(p), { recursive: true });
          fs.writeFileSync(p, o);
          console.log('ok', rel);
        } else console.log('skip', rel);
        next();
      });
    });
  };
  next();
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
