const { Client } = require('ssh2');
const https = require('https');

function curlHealth(host, path) {
  return new Promise((resolve) => {
    const req = https.request({ hostname: host, path, method: 'GET', timeout: 8000 }, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => resolve({ status: res.statusCode, body: b.slice(0, 200) }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.end();
  });
}

const cl = new Client();
cl.on('ready', () => {
  const cmd = [
    'echo "=== PM2 ==="',
    'pm2 list 2>/dev/null || echo pm2_empty',
    'echo "=== node listen ==="',
    'ss -tlnp 2>/dev/null | grep -E ":300[0-9]|:3001|:3002" || netstat -tlnp 2>/dev/null | grep -E ":300[0-9]" || echo no_listen',
    'echo "=== curl local ==="',
    'curl -sk -m 5 -o /dev/null -w "3001:%{http_code}\\n" https://127.0.0.1:3001/api/v1/core/service-home-modules 2>/dev/null || echo 3001_fail',
    'curl -sk -m 5 -o /dev/null -w "3002:%{http_code}\\n" http://127.0.0.1:3002/api/v1/core/service-home-modules 2>/dev/null || echo 3002_fail',
    'ps aux | grep -E "node.*community|node.*backend" | grep -v grep | head -5'
  ].join(' ; ');
  cl.exec(cmd, (e, s) => {
    s.on('data', (x) => process.stdout.write(x));
    s.stderr.on('data', (x) => process.stderr.write(x));
    s.on('close', async () => {
      cl.end();
      console.log('\n=== public API ===');
      const r1 = await curlHealth('jshsp1.eds-tech.cn', '/api/v1/core/service-home-modules');
      console.log('jshsp1', r1);
    });
  });
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
