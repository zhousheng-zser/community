#!/usr/bin/env node
/**
 * 一键：上传小程序代码 → 生成预览二维码 → 邮件发送二维码给配置中的收件人
 *
 * 依赖：与本仓库 scripts/wechat-preview.js 相同（微信开发者工具 CLI、nodemailer、scripts/email-config.js）
 *
 * 用法：
 *   node scripts/upload-preview-email.js
 *   npm run release:preview-email
 *   node scripts/upload-preview-email.js -v 2.1.0 -d "修复首页"
 *   node scripts/upload-preview-email.js --skip-upload    # 仅预览+发邮件（跳过上传）
 */

const { spawnSync } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PREVIEW_SCRIPT = path.join(__dirname, 'wechat-preview.js');

function pad(n) {
  return String(n).padStart(2, '0');
}

function defaultVersion() {
  const d = new Date();
  return `1.${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function printHelp() {
  console.log(`
一键上传 + 预览二维码 + 邮件

用法:
  node scripts/upload-preview-email.js [选项]
  npm run release:preview-email

选项:
  -v, --version <版本号>   上传版本号（默认自动生成）
  -d, --desc <描述>       上传描述（默认含当前时间）
  --skip-upload          跳过上传，仅预览二维码并发邮件
  -h, --help             显示帮助
`);
}

function parseArgs(argv) {
  let version = null;
  let desc = null;
  let skipUpload = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') {
      printHelp();
      process.exit(0);
    } else if (a === '-v' || a === '--version') {
      version = argv[++i];
    } else if (a === '-d' || a === '--desc') {
      desc = argv[++i];
    } else if (a === '--skip-upload') {
      skipUpload = true;
    }
  }
  return {
    version: version || defaultVersion(),
    desc: desc || `上传并预览 ${new Date().toLocaleString('zh-CN')}`,
    skipUpload,
  };
}

function runPreviewCli(extraArgs) {
  const r = spawnSync(process.execPath, [PREVIEW_SCRIPT, ...extraArgs], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
  });
  if (r.status !== 0 && r.status !== null) {
    process.exit(r.status);
  }
  if (r.error) {
    console.error('[一键发布]', r.error.message);
    process.exit(1);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  console.log('[一键发布] 版本号:', opts.version);
  console.log('[一键发布] 描述:', opts.desc);
  console.log('');

  if (!opts.skipUpload) {
    console.log('[一键发布] ①/② 上传代码到微信公众平台（开发者工具 CLI）...\n');
    runPreviewCli([
      '--upload',
      '--version', opts.version,
      '--desc', opts.desc,
    ]);
    console.log('');
  } else {
    console.log('[一键发布] 已跳过上传（--skip-upload）\n');
  }

  console.log('[一键发布] ②/② 生成预览二维码并发送邮件...\n');
  runPreviewCli([
    '--email',
    '--version', opts.version,
    '--desc', opts.desc,
  ]);

  console.log('\n[一键发布] 全部完成。');
}

main();
