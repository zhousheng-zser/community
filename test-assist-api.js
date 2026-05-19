const http = require('http');

const BASE = 'https://jshsp1.eds-tech.cn';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwib3BlbmlkIjoicGhvbmVfMTM4MDAxMzgwMDAiLCJ0b2tlbl92ZXJzaW9uIjowLCJpYXQiOjE3NzcwMjMzNjUsImV4cCI6MTc3NzYyODE2NX0.xvts6m1DQnCC8qEWNniaFGGGFEYW_2Lz7xiXNJuOMPw';

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    };
    const r = http.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, data: JSON.parse(d) }); }
        catch (e) { resolve({ statusCode: res.statusCode, data: d }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function test() {
  console.log('===== Test: GET /neighbor-assist/orders/my?role=publisher =====');
  try {
    const res = await req('GET', '/api/v1/neighbor-assist/orders/my?role=publisher&page=1&limit=50');
    console.log('Status:', res.statusCode);
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }

  console.log('\n===== Test: GET /neighbor-assist/orders/my?role=helper =====');
  try {
    const res = await req('GET', '/api/v1/neighbor-assist/orders/my?role=helper&page=1&limit=50');
    console.log('Status:', res.statusCode);
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }

  console.log('\n===== Test: GET /neighbor-assist/orders/pool =====');
  try {
    const res = await req('GET', '/api/v1/neighbor-assist/orders/pool?page=1&limit=12');
    console.log('Status:', res.statusCode);
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
