const { Client } = require('ssh2');
const cl = new Client();
cl.on('ready', () => {
  const cmd = [
    'grep -n login_sms /root/community-backend/backend/src/routes/authRoutes.js 2>/dev/null || echo NO_ROUTE',
    'curl -sk -m 6 -X POST https://127.0.0.1:3001/api/v1/auth/login_sms -H "Content-Type: application/json" -d \'{"phone":"13800001111","code":"024680"}\'',
    'echo ""',
    'curl -sk -m 6 -X POST https://127.0.0.1:3001/api/v1/auth/login_sms -H "Content-Type: application/json" -d \'{"phone":"13800001111","code":"123456"}\'',
    'echo ""',
    'curl -sk -m 6 -X POST https://jshsp1.eds-tech.cn/api/v1/auth/login_sms -H "Content-Type: application/json" -d \'{"phone":"13800001111","code":"024680"}\''
  ].join(' && ');
  cl.exec(cmd, (e, s) => {
    s.on('data', x => process.stdout.write(x));
    s.on('close', () => cl.end());
  });
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
