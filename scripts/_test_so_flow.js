const https = require('https');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const r = https.request({
      hostname: 'jshsp1.eds-tech.cn',
      path: '/api/v1' + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(data ? { 'Content-Length': data.length } : {})
      }
    }, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(b) });
        } catch (e) {
          resolve({ status: res.statusCode, body: b });
        }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  const login = await req('POST', '/auth/login_sms', { phone: '13800001111', code: '123456' });
  const token = login.body.token;
  console.log('login', login.status, login.body.code || login.body.msg);
  if (!token) return;

  const grp = await req('GET', '/core/service-groups/beauty_home', null, token);
  const services = grp.body.data && grp.body.data.services;
  const sid = services && services[0] && services[0].id;
  console.log('first service id', sid);

  const create = await req('POST', '/service-orders', {
    service_id: sid,
    group_key: 'beauty_home',
    address: 'test addr',
    contact_name: 'test',
    contact_phone: '13800001111',
    qty: 1
  }, token);
  console.log('create', create.status, JSON.stringify(create.body).slice(0, 200));

  const oid = create.body.data && create.body.data.id;
  if (oid) {
    const pay = await req('POST', `/service-orders/${oid}/pay`, {}, token);
    console.log('pay', pay.status, JSON.stringify(pay.body).slice(0, 150));
    const my = await req('GET', '/service-orders/my?page=1&limit=5', null, token);
    const list = my.body.data && my.body.data.list;
    console.log('my latest', list && list[0] && { id: list[0].id, status: list[0].status, group_key: list[0].group_key });
  }
})();
