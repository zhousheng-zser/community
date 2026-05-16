#!/usr/bin/env node
/**
 * 微信小程序预览二维码生成脚本
 * 调用微信开发者工具 CLI 自动生成体验版（预览版）二维码，支持邮件发送
 *
 * 前置条件：
 * 1. 已安装微信开发者工具
 * 2. 在开发者工具中开启「设置 → 安全 → 服务端口」
 * 3. 已登录微信开发者工具
 * 4. 如需邮件发送，配置 scripts/email-config.js
 *
 * 使用方法：
 *   node scripts/wechat-preview.js
 *   node scripts/wechat-preview.js --upload --version 1.0.0 --desc "测试版本"
 *   node scripts/wechat-preview.js --format base64
 *   node scripts/wechat-preview.js --email          # 生成后发送邮件
 *   node scripts/wechat-preview.js --serverchan     # 生成后通过 Server 酱推送
 *   node scripts/wechat-preview.js --wxwork         # 生成后通过企业微信群机器人推送
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// ============ 配置区域 ============

// 微信开发者工具安装路径（Windows 默认路径）
const DEFAULT_WIN_CLI = 'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat';
const DEFAULT_WIN_CLI_X64 = 'C:\\Program Files\\Tencent\\微信web开发者工具\\cli.bat';

// 用户自定义路径（可通过环境变量 WECHAT_DEVTOOLS_CLI 或修改此处配置）
const CUSTOM_WIN_CLI = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\微信开发者工具\\cli.bat';
const DRIVE_D_CLI = 'D:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat';

// 二维码输出目录
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'preview-output');

// 邮件配置文件路径
const EMAIL_CONFIG_PATH = path.join(__dirname, 'email-config.js');

// Server 酱配置文件路径
const SERVERCHAN_CONFIG_PATH = path.join(__dirname, 'serverchan-config.js');

// 企业微信群机器人配置文件路径
const WXWORK_CONFIG_PATH = path.join(__dirname, 'wxwork-config.js');

// ============ 工具函数 ============

function log(message) {
  console.log(`[预览脚本] ${message}`);
}

function error(message) {
  console.error(`[预览脚本] ❌ ${message}`);
}

function success(message) {
  console.log(`[预览脚本] ✅ ${message}`);
}

function findCliPath() {
  const isWin = process.platform === 'win32';

  if (!isWin) {
    // macOS
    const macPaths = [
      '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
      '/Applications/微信开发者工具.app/Contents/MacOS/cli',
    ];
    for (const p of macPaths) {
      if (fs.existsSync(p)) return p;
    }
    throw new Error('未找到微信开发者工具 CLI，请确认已安装。macOS 默认路径：/Applications/wechatwebdevtools.app/Contents/MacOS/cli');
  }

  // Windows
  const winPaths = [
    process.env.WECHAT_DEVTOOLS_CLI,
    DRIVE_D_CLI,
    CUSTOM_WIN_CLI,
    DEFAULT_WIN_CLI_X64,
    DEFAULT_WIN_CLI,
  ].filter(Boolean);

  // 尝试从快捷方式目录查找实际安装路径
  try {
    const startMenuDir = 'C:\\Users\\Administrator\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\微信开发者工具';
    if (fs.existsSync(startMenuDir)) {
      const files = fs.readdirSync(startMenuDir);
      for (const file of files) {
        if (file.endsWith('.lnk')) {
          // 尝试解析快捷方式指向的路径（通过 PowerShell）
          try {
            const lnkPath = path.join(startMenuDir, file);
            const psCmd = `powershell -NoProfile -Command "(New-Object -ComObject WScript.Shell).CreateShortcut('${lnkPath.replace(/'/g, "''")}').TargetPath"`;
            const targetPath = execSync(psCmd, { encoding: 'utf8', windowsHide: true }).trim();
            if (targetPath && fs.existsSync(targetPath)) {
              const possibleCli = path.join(path.dirname(targetPath), 'cli.bat');
              if (fs.existsSync(possibleCli)) {
                winPaths.unshift(possibleCli);
                break;
              }
            }
          } catch { /* ignore */ }
        }
      }
    }
  } catch { /* ignore */ }

  // 尝试从注册表查找
  try {
    const regQuery = execSync('reg query "HKLM\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall" /s /f "微信开发者工具" 2>nul', { encoding: 'utf8', windowsHide: true });
    const match = regQuery.match(/InstallLocation\s+REG_SZ\s+(.+)/i);
    if (match) {
      const installDir = match[1].trim();
      winPaths.unshift(path.join(installDir, 'cli.bat'));
    }
  } catch { /* ignore */ }

  for (const p of winPaths) {
    if (fs.existsSync(p)) return p;
  }

  throw new Error(
    `未找到微信开发者工具 CLI。\n` +
    `请确认已安装微信开发者工具，并开启「设置 → 安全 → 服务端口」。\n` +
    `也可以手动设置环境变量 WECHAT_DEVTOOLS_CLI 指向 cli.bat 路径。`
  );
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    upload: false,
    version: '1.0.0',
    desc: `预览版 ${new Date().toLocaleString('zh-CN')}`,
    format: 'image', // terminal | image | base64
    output: null,
    autoPreview: false,
    infoOutput: null,
    sendEmail: false, // 是否发送邮件
    sendServerChan: false, // 是否通过 Server 酱推送
    sendWxWork: false, // 是否通过企业微信群机器人推送
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--upload':
      case '-u':
        options.upload = true;
        break;
      case '--version':
      case '-v':
        options.version = args[++i];
        break;
      case '--desc':
      case '-d':
        options.desc = args[++i];
        break;
      case '--format':
      case '-f':
        options.format = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--auto-preview':
      case '-a':
        options.autoPreview = true;
        break;
      case '--info-output':
      case '-i':
        options.infoOutput = args[++i];
        break;
      case '--email':
      case '-e':
        options.sendEmail = true;
        break;
      case '--serverchan':
      case '-s':
        options.sendServerChan = true;
        break;
      case '--wxwork':
      case '-w':
        options.sendWxWork = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  // 设置默认输出路径
  if (!options.output && options.format === 'image') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    options.output = path.join(OUTPUT_DIR, `preview-qr-${timestamp}.png`);
  }
  if (!options.infoOutput) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    options.infoOutput = path.join(OUTPUT_DIR, `preview-info-${timestamp}.json`);
  }

  return options;
}

function printHelp() {
  console.log(`
微信小程序预览二维码生成脚本

用法：
  node scripts/wechat-preview.js [选项]

选项：
  --upload, -u              上传代码（而不是仅预览）
  --version, -v <版本号>     上传时的版本号（默认：1.0.0）
  --desc, -d <描述>          版本描述（默认：当前时间）
  --format, -f <格式>        二维码格式：terminal | image | base64（默认：image）
  --output, -o <路径>        二维码输出路径
  --auto-preview, -a        自动推送到手机预览
  --info-output, -i <路径>   预览信息输出路径
  --email, -e               生成后发送二维码到邮件（需配置 email-config.js）
  --serverchan, -s          生成后通过 Server 酱推送（需配置 serverchan-config.js）
  --wxwork, -w              生成后通过企业微信群机器人推送（需配置 wxwork-config.js）
  --help, -h                显示帮助

示例：
  node scripts/wechat-preview.js
  node scripts/wechat-preview.js --upload --version 2.0.0 --desc "修复BUG"
  node scripts/wechat-preview.js --format base64
  node scripts/wechat-preview.js --auto-preview
  node scripts/wechat-preview.js --email              # 生成并发送邮件
`);
}

function runCli(cliPath, args) {
  const cmd = `"${cliPath}" ${args.join(' ')}`;
  log(`执行命令: ${cmd}`);
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      cwd: PROJECT_ROOT,
      timeout: 120000,
      windowsHide: true,
    });
    return { success: true, output: result };
  } catch (err) {
    return { success: false, output: err.stdout || '', error: err.stderr || err.message, code: err.status };
  }
}

function openFile(filePath) {
  const isWin = process.platform === 'win32';
  try {
    if (isWin) {
      execSync(`start "" "${filePath}"`, { windowsHide: true });
    } else {
      execSync(`open "${filePath}"`);
    }
  } catch {
    log(`无法自动打开文件：${filePath}`);
  }
}

// ============ 邮件发送功能 ============

async function sendPreviewEmail(qrImagePath, previewInfo, options) {
  log('准备发送邮件...');

  // 检查邮件配置是否存在
  if (!fs.existsSync(EMAIL_CONFIG_PATH)) {
    error(`邮件配置文件不存在: ${EMAIL_CONFIG_PATH}`);
    log('请复制 scripts/email-config.template.js 为 scripts/email-config.js 并填写配置');
    return false;
  }

  // 加载邮件配置
  let emailConfig;
  try {
    // 清除 require 缓存，确保获取最新配置
    delete require.cache[require.resolve(EMAIL_CONFIG_PATH)];
    emailConfig = require(EMAIL_CONFIG_PATH);
  } catch (err) {
    error(`加载邮件配置失败: ${err.message}`);
    return false;
  }

  // 验证配置
  if (!emailConfig.smtp?.auth?.user || !emailConfig.smtp?.auth?.pass) {
    error('邮件配置不完整：请填写发件人邮箱和授权码');
    log(`配置文件路径: ${EMAIL_CONFIG_PATH}`);
    return false;
  }

  if (!emailConfig.recipients || emailConfig.recipients.length === 0) {
    error('邮件配置不完整：请填写收件人列表');
    return false;
  }

  // 检查二维码文件
  if (!fs.existsSync(qrImagePath)) {
    error(`二维码文件不存在: ${qrImagePath}`);
    return false;
  }

  // 读取预览信息
  let sizeTotal = '未知';
  try {
    if (previewInfo && previewInfo.size && previewInfo.size.total) {
      const sizeMB = (previewInfo.size.total / 1024 / 1024).toFixed(2);
      sizeTotal = `${sizeMB} MB`;
    }
  } catch { /* ignore */ }

  // 获取项目名
  let projectName = '小程序';
  try {
    const projectConfig = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'project.config.json'), 'utf8'));
    if (projectConfig.projectname) {
      projectName = decodeURIComponent(projectConfig.projectname);
    }
  } catch { /* ignore */ }

  // 准备模板变量
  const templateVars = {
    version: options.version || '1.0.0',
    date: new Date().toLocaleString('zh-CN'),
    projectName,
    sizeTotal,
    qrPath: qrImagePath,
  };

  // 替换模板变量
  function replaceTemplate(template, vars) {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return result;
  }

  const subject = replaceTemplate(emailConfig.subjectTemplate || '【小程序预览】{projectName}', templateVars);
  const htmlBody = replaceTemplate(emailConfig.bodyTemplate || '', templateVars);

  // 创建邮件内容
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport(emailConfig.smtp);

  // 构建附件
  const attachments = [
    {
      filename: path.basename(qrImagePath),
      path: qrImagePath,
      cid: 'preview-qr', // Content-ID，用于在 HTML 中引用
    },
  ];

  // 如果有预览信息文件，也附加
  if (options.infoOutput && fs.existsSync(options.infoOutput)) {
    attachments.push({
      filename: path.basename(options.infoOutput),
      path: options.infoOutput,
    });
  }

  const mailOptions = {
    from: `"小程序预览" <${emailConfig.smtp.auth.user}>`,
    to: emailConfig.recipients.join(', '),
    subject,
    html: htmlBody + `
      <p><img src="cid:preview-qr" alt="预览二维码" style="max-width:300px;" /></p>
    `,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    success(`邮件发送成功！`);
    log(`收件人: ${emailConfig.recipients.join(', ')}`);
    log(`邮件ID: ${info.messageId}`);
    return true;
  } catch (err) {
    error(`邮件发送失败: ${err.message}`);
    if (err.code === 'EAUTH') {
      log('提示：请检查邮箱授权码是否正确（不是登录密码！）');
      log('QQ邮箱授权码获取：设置 → 账户 → 开启SMTP服务 → 获取授权码');
    }
    return false;
  }
}

// ============ 主流程 ============

async function main() {
  log('开始生成小程序预览二维码...\n');

  const options = parseArgs();

  // 1. 查找 CLI 路径
  let cliPath;
  try {
    cliPath = findCliPath();
    success(`找到微信开发者工具 CLI: ${cliPath}`);
  } catch (err) {
    error(err.message);
    process.exit(1);
  }

  // 2. 检查项目配置
  const projectConfigPath = path.join(PROJECT_ROOT, 'project.config.json');
  if (!fs.existsSync(projectConfigPath)) {
    error('未找到 project.config.json，请确认当前目录是小程序项目根目录');
    process.exit(1);
  }

  // 3. 确保输出目录存在
  ensureDir(OUTPUT_DIR);

  // 4. 根据模式执行
  if (options.upload) {
    // ============ 上传模式 ============
    log(`准备上传代码...`);
    log(`版本号: ${options.version}`);
    log(`版本描述: ${options.desc}`);

    const args = [
      'upload',
      '--project', `"${PROJECT_ROOT}"`,
      '--version', `"${options.version}"`,
      '--desc', `"${options.desc}"`,
      '--info-output', `"${options.infoOutput}"`,
    ];

    const result = runCli(cliPath, args);

    if (result.success) {
      success(`代码上传成功！`);
      log(`信息已保存至: ${options.infoOutput}`);
      if (fs.existsSync(options.infoOutput)) {
        const info = JSON.parse(fs.readFileSync(options.infoOutput, 'utf8'));
        log(`上传信息: ${JSON.stringify(info, null, 2)}`);
      }
    } else {
      error(`上传失败（退出码 ${result.code}）`);
      if (result.output) console.log(result.output);
      if (result.error) console.error(result.error);
      process.exit(1);
    }
  } else if (options.autoPreview) {
    // ============ 自动预览模式 ============
    log('准备自动预览（推送到手机）...');

    const args = [
      'auto-preview',
      '--project', `"${PROJECT_ROOT}"`,
      '--info-output', `"${options.infoOutput}"`,
    ];

    const result = runCli(cliPath, args);

    if (result.success) {
      success('自动预览已推送！请查看手机微信。');
    } else {
      error(`自动预览失败（退出码 ${result.code}）`);
      if (result.output) console.log(result.output);
      if (result.error) console.error(result.error);
      process.exit(1);
    }
  } else {
    // ============ 预览模式（生成二维码） ============
    log(`准备生成预览二维码...`);
    log(`格式: ${options.format}`);

    const args = [
      'preview',
      '--project', `"${PROJECT_ROOT}"`,
      '--qr-format', options.format,
      '--info-output', `"${options.infoOutput}"`,
    ];

    if (options.format === 'image' && options.output) {
      args.push('--qr-output', `"${options.output}"`);
      log(`二维码将保存至: ${options.output}`);
    }

    const result = runCli(cliPath, args);

    let previewInfo = null;

    if (result.success || result.code === 0) {
      success('预览二维码生成成功！');

      if (options.format === 'image' && options.output && fs.existsSync(options.output)) {
        success(`二维码图片已保存: ${options.output}`);
        // 尝试自动打开二维码图片
        openFile(options.output);
      }

      if (options.format === 'terminal') {
        console.log('\n--- 终端二维码 ---');
        console.log(result.output);
      }

      if (options.format === 'base64') {
        console.log('\n--- Base64 二维码 ---');
        console.log(result.output.trim());
      }

      if (fs.existsSync(options.infoOutput)) {
        try {
          previewInfo = JSON.parse(fs.readFileSync(options.infoOutput, 'utf8'));
          log(`预览信息: ${JSON.stringify(previewInfo, null, 2)}`);
        } catch {
          // ignore parse error
        }
      }

      // ============ 发送邮件 ============
      if (options.sendEmail) {
        console.log('\n----------------------------------------');
        const emailSent = await sendPreviewEmail(options.output, previewInfo, options);
        if (!emailSent) {
          log('邮件发送 skipped，请检查配置');
        }
      }

      // ============ Server 酱推送 ============
      if (options.sendServerChan) {
        console.log('\n----------------------------------------');
        const { sendViaServerChan } = require('./notifier-serverchan');
        const sent = await sendViaServerChan({
          qrImagePath: options.output,
          previewInfo,
          options,
          projectRoot: PROJECT_ROOT,
          log, success, error,
        });
        if (!sent) {
          log('Server 酱推送 skipped，请检查 ' + SERVERCHAN_CONFIG_PATH);
        }
      }

      // ============ 企业微信群机器人推送 ============
      if (options.sendWxWork) {
        console.log('\n----------------------------------------');
        const { sendViaWxWork } = require('./notifier-wxwork');
        const sent = await sendViaWxWork({
          qrImagePath: options.output,
          previewInfo,
          options,
          projectRoot: PROJECT_ROOT,
          log, success, error,
        });
        if (!sent) {
          log('企业微信推送 skipped，请检查 ' + WXWORK_CONFIG_PATH);
        }
      }
    } else {
      error(`预览失败（退出码 ${result.code}）`);
      if (result.output) console.log(result.output);
      if (result.error) console.error(result.error);
      process.exit(1);
    }
  }

  console.log('\n----------------------------------------');
  log('所有操作已完成！');
}

main().catch(err => {
  error(err.message);
  process.exit(1);
});
