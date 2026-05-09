/**
 * Server 酱（方糖）推送适配
 * 由 wechat-preview.js 在 --serverchan / -s 模式下调用
 *
 * 接口：POST https://sctapi.ftqq.com/{SENDKEY}.send
 * 文档：https://sct.ftqq.com/
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'serverchan-config.js');

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

async function sendViaServerChan({ qrImagePath, previewInfo, options, projectRoot, log, success, error }) {
  if (typeof fetch !== 'function') {
    error('当前 Node 版本过低，缺少全局 fetch（请使用 Node 18+）。');
    return false;
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    error(`Server 酱配置文件不存在: ${CONFIG_PATH}`);
    log('已创建模板，请编辑后填入 sendKey 再次执行');
    return false;
  }

  delete require.cache[require.resolve(CONFIG_PATH)];
  const cfg = require(CONFIG_PATH);

  if (!cfg || !cfg.sendKey) {
    error('Server 酱 sendKey 未配置');
    log(`请在 ${CONFIG_PATH} 中填写 sendKey`);
    log('登录 https://sct.ftqq.com/ 获取 SendKey');
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

  const title = applyTemplate(cfg.titleTemplate || '【小程序预览】{projectName} - {date}', vars);

  let desp = '';
  desp += `## ${vars.projectName} 预览二维码已生成\n\n`;
  desp += `- 版本号：**${vars.version}**\n`;
  desp += `- 生成时间：${vars.date}\n`;
  desp += `- 代码包大小：${vars.sizeTotal}\n\n`;
  desp += `请使用微信扫描下方二维码进行预览。\n\n`;
  desp += `> **二维码有效期约 25 分钟**，过期后需重新生成。\n\n`;

  if (cfg.embedQrAsBase64 !== false) {
    try {
      const buf = fs.readFileSync(qrImagePath);
      const b64 = buf.toString('base64');
      desp += `![预览二维码](data:image/png;base64,${b64})\n\n`;
      desp += `_若图片无法直接显示，请打开 [sct.ftqq.com](https://sct.ftqq.com/) 「消息记录」页面查看完整二维码。_\n`;
    } catch (e) {
      log(`读取二维码图片失败：${e.message}`);
    }
  }

  const url = `https://sctapi.ftqq.com/${encodeURIComponent(cfg.sendKey)}.send`;
  const form = new URLSearchParams();
  form.append('title', title);
  form.append('desp', desp);

  log('正在通过 Server 酱推送...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* not json */ }

    const ok = res.ok && data && (data.code === 0 || data.data || data.pushid);
    if (ok) {
      const pushid = (data.data && data.data.pushid) || data.pushid || 'N/A';
      success(`Server 酱推送成功！pushid=${pushid}`);
      return true;
    }

    const code = data && data.code;
    const msg = (data && (data.message || data.errors)) || text;
    error(`Server 酱推送失败：code=${code} message=${msg}`);
    return false;
  } catch (e) {
    error(`Server 酱推送异常：${e.message}`);
    return false;
  }
}

module.exports = { sendViaServerChan };
