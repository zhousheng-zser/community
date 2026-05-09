/**
 * 企业微信群机器人推送适配
 * 由 wechat-preview.js 在 --wxwork / -w 模式下调用
 *
 * 接口：POST {webhookUrl}
 * 文档：https://developer.work.weixin.qq.com/document/path/91770
 *
 * 本模块发送两条消息：
 *   1. markdown：项目名/版本/时间/大小/有效期（可 @人）
 *   2. image：二维码 PNG（base64 + 原文件 md5）
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONFIG_PATH = path.join(__dirname, 'wxwork-config.js');

// 企业微信图片消息上限（编码前 2MB）
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function getProjectName(projectRoot) {
  const cfg = readJsonSafe(path.join(projectRoot, 'project.config.json'));
  if (cfg && cfg.projectname) {
    try {
      return decodeURIComponent(cfg.projectname);
    } catch {
      return cfg.projectname;
    }
  }
  return '小程序';
}

function buildSizeText(previewInfo) {
  try {
    if (previewInfo && previewInfo.size && previewInfo.size.total) {
      return (previewInfo.size.total / 1024 / 1024).toFixed(2) + ' MB';
    }
  } catch { /* ignore */ }
  return '未知';
}

function applyTemplate(tpl, vars) {
  let result = tpl || '';
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{${k}}`, 'g'), v);
  }
  return result;
}

async function postWebhook(webhookUrl, payload) {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* ignore */ }
  const ok = res.ok && data && data.errcode === 0;
  return { ok, data, raw: text, status: res.status };
}

async function sendViaWxWork({ qrImagePath, previewInfo, options, projectRoot, log, success, error }) {
  if (typeof fetch !== 'function') {
    error('当前 Node 版本过低，缺少全局 fetch（请使用 Node 18+）。');
    return false;
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    error(`企业微信配置文件不存在: ${CONFIG_PATH}`);
    return false;
  }

  delete require.cache[require.resolve(CONFIG_PATH)];
  const cfg = require(CONFIG_PATH);

  if (!cfg || !cfg.webhookUrl || !/^https:\/\/qyapi\.weixin\.qq\.com\/cgi-bin\/webhook\/send\?key=/.test(cfg.webhookUrl)) {
    error('企业微信 webhookUrl 未配置或格式不正确');
    log(`请在 ${CONFIG_PATH} 中填写 webhookUrl`);
    log('在企业微信群「群机器人」处获取 Webhook 地址');
    return false;
  }

  if (!qrImagePath || !fs.existsSync(qrImagePath)) {
    error(`二维码文件不存在: ${qrImagePath}`);
    return false;
  }

  const vars = {
    projectName: getProjectName(projectRoot),
    date: new Date().toLocaleString('zh-CN'),
    version: options.version || '1.0.0',
    sizeTotal: buildSizeText(previewInfo),
  };

  const title = applyTemplate(cfg.titleTemplate || '【小程序预览】{projectName} v{version}', vars);

  // 1. markdown 消息
  let mdContent = '';
  mdContent += `### ${title}\n`;
  mdContent += `> 请使用微信扫描下方二维码进行预览\n\n`;
  mdContent += `**项目**：${vars.projectName}\n`;
  mdContent += `**版本**：<font color="info">${vars.version}</font>\n`;
  mdContent += `**生成时间**：${vars.date}\n`;
  mdContent += `**代码包大小**：${vars.sizeTotal}\n`;
  mdContent += `**有效期**：约 25 分钟，过期请重新生成\n`;

  const mentions = Array.isArray(cfg.mentionMobileList) ? cfg.mentionMobileList.filter(Boolean) : [];
  if (mentions.length > 0) {
    if (mentions.includes('@all')) {
      mdContent += `\n<@all>`;
    } else {
      mdContent += `\n` + mentions.map((m) => `<@${m}>`).join(' ');
    }
  }

  log('正在通过企业微信群机器人推送 markdown 消息...');
  const r1 = await postWebhook(cfg.webhookUrl, {
    msgtype: 'markdown',
    markdown: { content: mdContent },
  });
  if (!r1.ok) {
    error(`markdown 推送失败：errcode=${r1.data && r1.data.errcode} errmsg=${(r1.data && r1.data.errmsg) || r1.raw}`);
    return false;
  }
  success('markdown 消息已发送');

  // 2. image 消息
  if (cfg.sendQrImage === false) return true;

  const buf = fs.readFileSync(qrImagePath);
  if (buf.length > IMAGE_MAX_BYTES) {
    error(`二维码图片过大（${(buf.length / 1024).toFixed(0)}KB > 2MB 限制），跳过图片消息`);
    return true;
  }
  const md5 = crypto.createHash('md5').update(buf).digest('hex');
  const base64 = buf.toString('base64');

  log('正在推送二维码图片消息...');
  const r2 = await postWebhook(cfg.webhookUrl, {
    msgtype: 'image',
    image: { base64, md5 },
  });
  if (!r2.ok) {
    error(`image 推送失败：errcode=${r2.data && r2.data.errcode} errmsg=${(r2.data && r2.data.errmsg) || r2.raw}`);
    return false;
  }
  success('二维码图片已发送，团队成员可直接在群里扫码');
  return true;
}

module.exports = { sendViaWxWork };
