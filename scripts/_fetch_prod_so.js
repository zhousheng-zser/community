const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const cl = new Client();
cl.on('ready', () => {
  const files = [
    ['/root/community-backend/backend/src/controllers/serviceOrderController.js', 'backend/src/controllers/serviceOrderController.js'],
    ['/root/community-backend/backend/src/routes/serviceOrderRoutes.js', 'backend/src/routes/serviceOrderRoutes.js'],
    ['/root/community-backend/backend/src/controllers/adminDispatchController.js', 'backend/src/controllers/adminDispatchController.js']
  ];
  let i = 0;
  const next = () => {
    if (i >= files.length) { cl.end(); return; }
    const [remote, local] = files[i++];
    cl.exec(`cat ${remote}`, (e, s) => {
      let o = '';
      s.on('data', (x) => { o += x; });
      s.on('close', () => {
        const p = path.join(__dirname, '..', local);
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, o);
        console.log('saved', local, o.length);
        next();
      });
    });
  };
  next();
}).connect({ host: '8.140.204.254', port: 22, username: 'root', password: 'edS904062' });
