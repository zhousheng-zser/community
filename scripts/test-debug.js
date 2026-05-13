#!/usr/bin/env node
const http = require('http');
const jwt = require('jsonwebtoken');
const JWT = 'jwt_key_cwsgwbd';
const TOKEN = jwt.sign({ id: 1, openid: 't1', token_version: 0 }, JWT, { expiresIn: '7d' });

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://ancientscrolllibrary.cn:3002/api/v1');
    console.log('REQ:', method, url.pathname + url.search);
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      method, hostname: url.hostname, port: url.port, path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN }
    };
    const r = http.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, raw: d }); }
      });
    });
    r.on('error', reject);
    r.setTimeout(15000, () => { r.destroy(); reject(new Error('T')); });
    if (payload) r.write(payload);
    r.end();
  });
}

(async () => {
  console.log('=== Create order ===');
  const c = await req('POST', '/neighbor-assist/orders', {
    assist_type: '陪读', community_id: 1,
    origin_address_snapshot: { address: '测试地址' },
    destination_address_snapshot: { address: '测试地址' },
    content: '测试内容', remark: '测试内容', reward_amount: 25
  });
  console.log('create status:', c.status);
  console.log('create json:', JSON.stringify(c.json));
  console.log('create raw:', c.raw);

  if (c.json && c.json.data && c.json.data.id) {
    const oid = c.json.data.id;
    console.log('\n=== Order detail ===');
    const d = await req('GET', '/neighbor-assist/orders/' + oid);
    console.log('detail status:', d.status);
    console.log('detail json:', JSON.stringify(d.json, null, 2).slice(0, 500));
  }

  console.log('\n=== My list ===');
  const l = await req('GET', '/neighbor-assist/orders/my?role=publisher');
  console.log('list status:', l.status);
  console.log('list json:', JSON.stringify(l.json, null, 2).slice(0, 500));
})();
