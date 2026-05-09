/**
 * 邮件配置模板
 * 使用方法：
 * 1. 复制此文件为 email-config.js
 * 2. 填写你的邮箱和授权码
 * 3. 确保 email-config.js 已添加到 .gitignore，避免泄露敏感信息
 *
 * QQ邮箱授权码获取方式：
 * 登录 QQ邮箱 → 设置 → 账户 → 开启 SMTP 服务 → 获取授权码
 */

module.exports = {
  // SMTP 服务器配置（QQ邮箱示例）
  smtp: {
    host: 'smtp.qq.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      // 发件人邮箱地址
      user: 'your-email@qq.com',
      // 邮箱授权码（不是登录密码！）
      pass: 'your-authorization-code',
    },
  },

  // 邮件接收人列表（可配置多个）
  recipients: [
    '1124497684@qq.com',
    // 'other@example.com',
  ],

  // 邮件主题模板（支持占位符）
  // 可用占位符：{version}, {date}, {projectName}
  subjectTemplate: '【小程序预览】{projectName} - {date}',

  // 邮件正文模板
  // 可用占位符：{version}, {date}, {projectName}, {sizeTotal}, {qrPath}
  bodyTemplate: `
<p>您好，</p>
<p>小程序 <strong>{projectName}</strong> 的预览二维码已生成。</p>

<p><strong>版本信息：</strong></p>
<ul>
  <li>版本号：{version}</li>
  <li>生成时间：{date}</li>
  <li>代码包大小：{sizeTotal}</li>
</ul>

<p>请使用微信扫描附件中的二维码进行预览。</p>
<p>二维码有效期约 25 分钟，过期后需重新生成。</p>

<br>
<p>此邮件由自动化脚本发送</p>
`,
};
