const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`cat /home/cw/a/community-backend/backend/src/models/NeighborAssistOrder.js`, (err, stream) => {
    if (err) return console.error(err);
    let content = '';
    stream.on('data', d => content += d.toString());
    stream.on('end', () => {
      console.log('Current model file:');
      console.log(content);
      conn.end();
    });
  });
}).connect({ host: '192.168.110.50', username: 'cw', readyTimeout: 10000 });
