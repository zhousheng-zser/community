const https = require('https');
const data = JSON.stringify({ phone: '13800001111', code: '123456' });
const req = https.request({
  hostname: 'jshsp1.eds-tech.cn',
  path: '/api/v1/auth/login_sms',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => console.log(res.statusCode, b));
});
req.on('error', e => console.error(e));
req.write(data);
req.end();
