const { Client } = require('ssh2');
const cl = new Client();
cl.on('ready', () => {
  const cmd = `cd /root/community-backend/backend && \
echo "=== nodemon ps ===" && ps aux | grep nodemon | grep -v grep && \
echo "=== old log ===" && tail -30 /tmp/community-backend.log 2>/dev/null; \
pkill -f "nodemon src/index" 2>/dev/null || true; \
pkill -f "node src/index.js" 2>/dev/null || true; sleep 2; \
export NODE_ENV=production && nohup node src/index.js > /tmp/community-backend.log 2>&1 & \
sleep 5 && \
echo "=== listen ===" && (ss -tlnp 2>/dev/null | grep -E ":3001|:3002" || netstat -tlnp 2>/dev/null | grep -E ":3001|:3002" || echo no_port) && \
echo "=== startup log ===" && tail -35 /tmp/community-backend.log && \
curl -sk -m 8 -o /dev/null -w "3001:%{http_code}\\n" https://127.0.0.1:3001/api/v1/core/service-home-modules 2>/dev/null; \
curl -sk -m 8 -o /dev/null -w "3002:%{http_code}\\n" http://127.0.0.1:3002/api/v1/core/service-home-modules 2>/dev/null`;
  cl.exec(cmd, (e, s) => {
    s.on('data', (x) => process.stdout.write(x));
    s.stderr.on('data', (x) => process.stderr.write(x));
    s.on('close', () => cl.end());
  });
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
