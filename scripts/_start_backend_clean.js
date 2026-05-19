const { Client } = require('ssh2');
function run(cl, cmd) {
  return new Promise((resolve) => {
    cl.exec(cmd, (e, s) => {
      let o = '';
      s.on('data', (x) => { o += x; process.stdout.write(x); });
      s.stderr.on('data', (x) => process.stderr.write(x));
      s.on('close', () => resolve(o));
    });
  });
}
const cl = new Client();
cl.on('ready', async () => {
  await run(cl, 'fuser -k 3001/tcp 3002/tcp 2>/dev/null; true');
  await run(cl, 'pkill -f "node src/index.js" 2>/dev/null; pkill -f nodemon 2>/dev/null; sleep 2; pgrep -af "index.js" | head -5');
  await run(cl, 'cd /root/community-backend/backend && NODE_ENV=production nohup node src/index.js >> /tmp/community-backend.log 2>&1 & echo started');
  await new Promise((r) => setTimeout(r, 7000));
  await run(cl, 'pgrep -af "node src/index" ; fuser 3001/tcp 3002/tcp 2>&1 ; tail -15 /tmp/community-backend.log');
  await run(cl, 'curl -sk -m 8 https://127.0.0.1:3001/api/v1/core/service-home-modules 2>&1 | head -c 200');
  await run(cl, 'curl -s -m 8 http://127.0.0.1:3002/api/v1/core/service-home-modules 2>&1 | head -c 200');
  await run(cl, 'curl -sk -m 8 https://jshsp1.eds-tech.cn/api/v1/core/service-home-modules 2>&1 | head -c 200');
  cl.end();
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
