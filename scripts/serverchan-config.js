/**
 * Server 酱（方糖）推送配置
 * ⚠️ 此文件包含敏感信息，请勿提交到 Git！
 *
 * 1. 登录 https://sct.ftqq.com/ （GitHub 账号即可）
 * 2. 在「SendKey」页面获取 SendKey
 * 3. 关注「方糖服务号」绑定微信，即可接收推送
 *
 * 备注：
 * - 免费版每天 5 条
 * - 二维码图片会以 base64 data URI 嵌入 markdown，在 sct.ftqq.com 历史
 *   页面通常可显示；部分微信客户端可能不渲染图片（仅显示文字）。
 */

module.exports = {
  // 必填：SendKey（形如 SCT123456ABCDEFG...）
  sendKey: '',

  // 是否把二维码图片作为 base64 内嵌到消息（关闭则只发文字摘要）
  embedQrAsBase64: true,

  // 标题模板：可用变量 {projectName} {date} {version}
  titleTemplate: '【小程序预览】{projectName} - {date}',
};
