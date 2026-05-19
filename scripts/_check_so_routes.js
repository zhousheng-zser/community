const { Client } = require('ssh2');
const cl = new Client();
cl.on('ready', () => {
  cl.exec(`grep -r "service-orders" /root/community-backend/backend/src/routes /root/community-backend/backend/src/app.js 2>/dev/null | head -20; ls -la /root/community-backend/backend/src/controllers/serviceOrderController.js 2>/dev/null; ls -la /root/community-backend/backend/src/modules/service-order/controllers/serviceOrder.controller.js 2>/dev/null`, (e, s) => {
    s.on('data', x => process.stdout.write(x));
    s.on('close', () => cl.end());
  });
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
