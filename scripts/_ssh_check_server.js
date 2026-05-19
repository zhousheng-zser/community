#!/usr/bin/env node
const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  const cmds = [
    'tail -80 /www/wwwlogs/nodejs/community-backend.log',
    // categories controller 源码
    'cat /root/community-backend/backend/src/controllers/coreDataController.js | grep -A 30 "getCategories"',
    // 直接查 db 测试
    'mysql -u root -p"CommunityPwd123!" community_db -e "SELECT id,name FROM Categories LIMIT 5;" 2>&1 | grep -v Warning',
  ];
  let i = 0;
  function next() {
    if (i >= cmds.length) { c.end(); return; }
    const cmd = cmds[i++];
    c.exec(cmd, (err, stream) => {
      if (err) { console.error(cmd, err.message); next(); return; }
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => {
        console.log('\n== ' + cmd.slice(0, 80) + ' ==');
        console.log(out.trim() || '(empty)');
        next();
      });
    });
  }
  next();
}).connect({
  host: '8.136.42.215', port: 22,
  username: 'root', password: '123',
  readyTimeout: 15000,
});
c.on('error', e => { console.error('SSH ERR:', e.message); process.exit(1); });
