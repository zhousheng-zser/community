/**
 * [开发阶段] 将 backend/ 同步到远程并执行 npm install（需本机已安装 Node）。
 * 开发阶段请参考 doc/项目开发参考.md。
 *
 * 用法（PowerShell）：
 *   $env:DEPLOY_SSH_PASSWORD = "你的root密码"
 *   npm run deploy:backend
 *
 * 可选环境变量：
 *   DEPLOY_HOST          默认 jshsp1.eds-tech.cn
 *   DEPLOY_USER          默认 root
 *   REMOTE_BACKEND_DIR   默认 /root/community-backend/backend
 *   DEPLOY_RESTART_CMD   非空则在远端执行（如 pm2 restart all 或 pm2 restart community-api）
 *   DEPLOY_RUN_SEED      设为 1 时远端执行 npm run seed:benefit（需库已建好且 .env 正确）
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');
const SftpClient = require('ssh2-sftp-client');

const host = process.env.DEPLOY_HOST || '114.55.167.14';
const username = process.env.DEPLOY_USER || 'root';
const password = process.env.DEPLOY_SSH_PASSWORD || '';
const remoteDir = (process.env.REMOTE_BACKEND_DIR || '/root/community-backend/backend').replace(/\/$/, '');
const localBackend = path.join(__dirname, '..', 'backend');

const IGNORE = new Set(['node_modules', '.git', '.env', 'npm-debug.log', 'yarn-error.log']);

function walkFiles(dir, base = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (IGNORE.has(name)) continue;
    const full = path.join(dir, name);
    const rel = path.relative(base, full);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkFiles(full, base, out);
    else out.push({ full, rel: rel.split(path.sep).join('/') });
  }
  return out;
}

function sshExec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream
        .on('close', (code) => resolve({ code, stdout, stderr }))
        .on('data', (d) => {
          stdout += d.toString();
        });
      stream.stderr.on('data', (d) => {
        stderr += d.toString();
      });
    });
  });
}

async function main() {
  if (!password) {
    console.error('请设置环境变量 DEPLOY_SSH_PASSWORD（不要用命令行参数，避免进 shell 历史）。');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(localBackend, 'package.json'))) {
    console.error('未找到 backend/package.json');
    process.exit(1);
  }

  const files = walkFiles(localBackend);
  console.log(`待上传文件数: ${files.length}，目标: ${username}@${host}:${remoteDir}`);

  const conn = new Client();
  await new Promise((resolve, reject) => {
    conn
      .on('ready', resolve)
      .on('error', reject)
      .connect({ host, port: 22, username, password, readyTimeout: 20000 });
  });

  try {
    const mkdir = await sshExec(conn, `mkdir -p "${remoteDir}"`);
    if (mkdir.code !== 0) {
      console.error('mkdir 失败', mkdir.stderr);
      process.exit(1);
    }

    const sftp = new SftpClient();
    await sftp.connect({ host, port: 22, username, password, readyTimeout: 20000 });

    for (const { full, rel } of files) {
      const remotePath = `${remoteDir}/${rel}`;
      const remoteParent = path.posix.dirname(remotePath);
      await sftp.mkdir(remoteParent, true).catch(() => {});
      await sftp.put(full, remotePath);
    }
    await sftp.end();
    console.log('SFTP 上传完成。');

    const install = await sshExec(
      conn,
      `cd "${remoteDir}" && npm install --omit=dev`
    );
    console.log(install.stdout);
    if (install.stderr) console.error(install.stderr);
    console.log('npm install 退出码:', install.code);

    if (process.env.DEPLOY_RUN_SEED === '1' || process.env.DEPLOY_RUN_SEED === 'true') {
      const seed = await sshExec(conn, `cd "${remoteDir}" && npm run seed:benefit`);
      console.log(seed.stdout);
      if (seed.stderr) console.error(seed.stderr);
      console.log('seed:benefit 退出码:', seed.code);
    }

    const restart = process.env.DEPLOY_RESTART_CMD || '';
    if (restart.trim()) {
      const r = await sshExec(conn, restart.trim());
      console.log(r.stdout);
      if (r.stderr) console.error(r.stderr);
      console.log('重启命令退出码:', r.code);
    } else {
      console.log('\n未设置 DEPLOY_RESTART_CMD。请 SSH 登录后自行执行，例如：');
      console.log(`  cd ${remoteDir} && pm2 restart <进程名>`);
      console.log('或: nohup node src/index.js > /tmp/api.log 2>&1 &');
    }

    const probe = await sshExec(
      conn,
      `curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/api/v1/jd/benefit/goods?scene=benefit_card" 2>/dev/null || echo fail`
    );
    console.log('\n本机探测 jd/benefit/goods HTTP 状态:', probe.stdout.trim());
  } finally {
    conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
