#!/usr/bin/env node
/**
 * 体验版：上传代码 →（公众平台设为体验版）→ 拉取体验版二维码 → 可选发邮件
 *
 * 与「预览版」区别：
 * - 预览版：cli preview，二维码约 25 分钟有效
 * - 体验版：需先 upload，再在 mp 后台「选为体验版」，二维码长期有效（体验成员可扫）
 *
 * 用法：
 *   node scripts/wechat-experience.js
 *   node scripts/wechat-experience.js --email
 *   node scripts/wechat-experience.js --skip-upload
 *   node scripts/wechat-experience.js -v 1.0.1 -d "体验版说明"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'preview-output');
const WX_OPEN_CONFIG = path.join(__dirname, 'wx-open-config.js');
const EMAIL_CONFIG = path.join(__dirname, 'email-config.js');

const DEFAULT_WIN_CLI = 'D:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat';

function log(m) { console.log(`[体验版] ${m}`); }
function ok(m) { console.log(`[体验版] ✅ ${m}`); }
function fail(m) { console.error(`[体验版] ❌ ${m}`); }

function findCliPath() {
  const candidates = [
    process.env.WECHAT_DEVTOOLS_CLI,
    DEFAULT_WIN_CLI,
    'C:\\Program Files\\Tencent\\微信web开发者工具\\cli.bat',
    'C:\\Users\\Administrator\\AppData\\Local\\Programs\\微信开发者工具\\cli.bat'
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('未找到微信开发者工具 cli.bat，请设置 WECHAT_DEVTOOLS_CLI');
}

function pad(n) { return String(n).padStart(2, '0'); }

function defaultVersion() {
  const d = new Date();
  return `1.${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    version: defaultVersion(),
    desc: `体验版 ${new Date().toLocaleString('zh-CN')}`,
    skipUpload: false,
    sendEmail: false,
    path: 'pages/index/index'
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--skip-upload') opts.skipUpload = true;
    else if (a === '--email' || a === '-e') opts.sendEmail = true;
    else if (a === '-v' || a === '--version') opts.version = args[++i];
    else if (a === '-d' || a === '--desc') opts.desc = args[++i];
    else if (a === '--path' || a === '-p') opts.path = args[++i];
    else if (a === '-h' || a === '--help') {
      console.log(`
体验版发布脚本

  node scripts/wechat-experience.js [--email] [-v 版本] [-d 描述] [--skip-upload]

配置 scripts/wx-open-config.js（appId + appSecret）后可自动下载体验版二维码。
上传后若未在后台「选为体验版」，拉码会失败，请先到 mp.weixin.qq.com → 版本管理 操作。
`);
      process.exit(0);
    }
  }
  return opts;
}

function runCli(cliPath, args) {
  const cmd = `"${cliPath}" ${args.join(' ')}`;
  log(`执行: ${cmd}`);
  try {
    const out = execSync(cmd, { encoding: 'utf8', cwd: PROJECT_ROOT, timeout: 180000, windowsHide: true });
    return { success: true, output: out };
  } catch (err) {
    return { success: err.status === 0, output: err.stdout || '', error: err.stderr || err.message, code: err.status };
  }
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const ct = res.headers['content-type'] || '';
        if (ct.includes('application/json') || (buf[0] === 0x7b && buf.length < 4096)) {
          try {
            const j = JSON.parse(buf.toString('utf8'));
            reject(new Error(j.errmsg || JSON.stringify(j)));
          } catch (e) {
            reject(e);
          }
          return;
        }
        resolve(buf);
      });
    }).on('error', reject);
  });
}

async function fetchAccessToken(appId, appSecret) {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(appSecret)}`;
  const buf = await httpsGet(url);
  const j = JSON.parse(buf.toString('utf8'));
  if (!j.access_token) throw new Error(j.errmsg || '获取 access_token 失败');
  return j.access_token;
}

async function fetchTrialQrBuffer(accessToken, pagePath) {
  const pathEnc = encodeURIComponent(pagePath);
  const url = `https://api.weixin.qq.com/wxa/get_qrcode?access_token=${encodeURIComponent(accessToken)}&path=${pathEnc}`;
  return httpsGet(url);
}

async function sendExperienceEmail(qrPath, opts) {
  if (!fs.existsSync(EMAIL_CONFIG)) {
    fail(`未找到 ${EMAIL_CONFIG}`);
    return false;
  }
  delete require.cache[require.resolve(EMAIL_CONFIG)];
  const emailConfig = require(EMAIL_CONFIG);
  const nodemailer = require('nodemailer');

  let projectName = '小程序';
  try {
    const pc = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'project.config.json'), 'utf8'));
    if (pc.projectname) projectName = decodeURIComponent(pc.projectname);
  } catch { /* ignore */ }

  const date = new Date().toLocaleString('zh-CN');
  const subject = `【小程序体验版】${projectName} - ${date}`;
  const html = `
<p>您好，</p>
<p>小程序 <strong>${projectName}</strong> 的体验版二维码已生成。</p>
<ul>
  <li>版本号：${opts.version}</li>
  <li>说明：${opts.desc}</li>
  <li>入口页：${opts.path}</li>
</ul>
<p>请使用<strong>已添加为体验成员</strong>的微信扫码。体验版与预览版不同，需在公众平台将对应开发版「选为体验版」后长期有效。</p>
<p><img src="cid:exp-qr" alt="体验版二维码" style="max-width:300px;" /></p>
`;

  const transporter = nodemailer.createTransport(emailConfig.smtp);
  await transporter.sendMail({
    from: `"小程序体验版" <${emailConfig.smtp.auth.user}>`,
    to: emailConfig.recipients.join(', '),
    subject,
    html,
    attachments: [{ filename: path.basename(qrPath), path: qrPath, cid: 'exp-qr' }]
  });
  ok(`邮件已发送至 ${emailConfig.recipients.join(', ')}`);
  return true;
}

async function main() {
  const opts = parseArgs();
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const qrOut = path.join(OUTPUT_DIR, `experience-qr-${ts}.jpg`);
  const infoOut = path.join(OUTPUT_DIR, `experience-info-${ts}.json`);

  let cliPath;
  try {
    cliPath = findCliPath();
    ok(`CLI: ${cliPath}`);
  } catch (e) {
    fail(e.message);
    process.exit(1);
  }

  if (!opts.skipUpload) {
    log(`上传代码 v${opts.version} …`);
    const args = [
      'upload',
      '--project', `"${PROJECT_ROOT}"`,
      '--version', `"${opts.version}"`,
      '--desc', `"${opts.desc}"`,
      '--info-output', `"${infoOut}"`
    ];
    const r = runCli(cliPath, args);
    if (!r.success) {
      fail(`上传失败: ${r.error || r.code}`);
      if (r.output) console.log(r.output);
      process.exit(1);
    }
    ok('代码已上传到微信公众平台（开发版本）');
    if (fs.existsSync(infoOut)) {
      try {
        const info = JSON.parse(fs.readFileSync(infoOut, 'utf8'));
        const mainKb = info.size && info.size.packages && info.size.packages.find((p) => p.name === 'main');
        if (mainKb) log(`主包约 ${Math.round(mainKb.size / 1024)} KB`);
      } catch { /* ignore */ }
    }
  }

  console.log('');
  log('── 重要：体验版需在公众平台手动确认一次 ──');
  log('1. 打开 https://mp.weixin.qq.com → 管理 → 版本管理');
  log(`2. 在「开发版本」中找到版本 ${opts.version}（或最新上传），点击「选为体验版」`);
  log('3. 「成员管理」中确认扫码微信已加入「体验成员」');
  console.log('');

  if (!fs.existsSync(WX_OPEN_CONFIG)) {
    log('未配置 scripts/wx-open-config.js，无法自动拉取体验版二维码。');
    log('请复制 scripts/wx-open-config.template.js 为 wx-open-config.js 并填写 AppSecret 后重试：');
    log('  node scripts/wechat-experience.js --skip-upload --email');
    log('或在公众平台版本管理页直接「扫描体验版二维码」。');
    process.exit(0);
  }

  delete require.cache[require.resolve(WX_OPEN_CONFIG)];
  const wxCfg = require(WX_OPEN_CONFIG);
  if (!wxCfg.appSecret || wxCfg.appSecret === 'YOUR_APP_SECRET') {
    fail('请在 wx-open-config.js 中填写有效的 appSecret');
    process.exit(1);
  }

  const appId = wxCfg.appId || 'wx563a4fb90c87e40d';
  log('正在获取体验版二维码（若后台尚未「选为体验版」可能失败）…');

  try {
    const token = await fetchAccessToken(appId, wxCfg.appSecret);
    const imgBuf = await fetchTrialQrBuffer(token, opts.path);
    fs.writeFileSync(qrOut, imgBuf);
    ok(`体验版二维码已保存: ${qrOut}`);
    try {
      execSync(`start "" "${qrOut}"`, { windowsHide: true });
    } catch { /* ignore */ }

    if (opts.sendEmail) {
      await sendExperienceEmail(qrOut, opts);
    }
  } catch (e) {
    fail(`拉取体验版二维码失败: ${e.message}`);
    log('请确认已在 mp 后台将刚上传的版本「选为体验版」，然后执行：');
    log('  node scripts/wechat-experience.js --skip-upload --email');
    process.exit(1);
  }

  ok('完成');
}

main().catch((e) => {
  fail(e.message);
  process.exit(1);
});
