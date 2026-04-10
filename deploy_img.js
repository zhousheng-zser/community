const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const config = {
  host: process.env.DEPLOY_HOST || 'jshsp1.eds-tech.cn',
  port: 22,
  username: process.env.DEPLOY_USER || 'root',
  password: process.env.DEPLOY_SSH_PASSWORD || ''
};

if (!config.password) {
  console.error('请设置环境变量 DEPLOY_SSH_PASSWORD');
  process.exit(1);
}

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Ready');
  // First, install Nginx and start it
  const installCmd = `
    if [ -x "$(command -v apt-get)" ]; then
      apt-get update && apt-get install -y nginx
      systemctl start nginx
      systemctl enable nginx
    elif [ -x "$(command -v yum)" ]; then
      yum install -y epel-release
      yum install -y nginx
      systemctl start nginx
      systemctl enable nginx
    fi
    mkdir -p /usr/share/nginx/html/img
    chmod 755 /usr/share/nginx/html/img
    mkdir -p /var/www/html/img
    chmod 755 /var/www/html/img
    echo "Nginx setup complete"
  `;
  
  conn.exec(installCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Nginx installation/configuration finished.');
      uploadFiles();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.error('STDERR: ' + data);
    });
  });
}).connect(config);

function uploadFiles() {
  const ClientSFTP = require('ssh2-sftp-client');
  const sftp = new ClientSFTP();
  const localDir = path.join(__dirname, 'img');
  const remoteDir = '/usr/share/nginx/html/img'; // Typical for CentOS Nginx
  
  sftp.connect(config).then(() => {
    console.log('SFTP connected, uploading img folder to ' + remoteDir);
    return sftp.uploadDir(localDir, remoteDir);
  }).then(() => {
    console.log('Upload to /usr/share/nginx/html/img successful.');
    // Also upload to /var/www/html/img for Debian/Ubuntu
    const remoteDir2 = '/var/www/html/img';
    return sftp.uploadDir(localDir, remoteDir2);
  }).then(() => {
    console.log('Upload to /var/www/html/img successful.');
    sftp.end();
    conn.end();
  }).catch(err => {
    console.error('SFTP Error:', err);
    sftp.end();
    conn.end();
  });
}
