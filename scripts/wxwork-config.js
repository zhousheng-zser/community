/**
 * 企业微信群机器人推送配置
 * ⚠️ webhookUrl 等同于凭证，请勿提交到 Git！
 *
 * 获取方式：
 *   企业微信群 → 右上角「...」→ 群机器人 → 添加 → 新建一个机器人
 *   复制「Webhook 地址」（形如：
 *     https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxx-xxxx-...）
 *
 * 接口文档：
 *   https://developer.work.weixin.qq.com/document/path/91770
 *
 * 推送内容：
 *   1. 一条 markdown 消息（项目名 / 版本 / 时间 / 有效期）
 *   2. 一条 image 消息（二维码 PNG，群成员可直接扫码）
 *   3. （可选）@相关成员（手机号）
 */

module.exports = {
  // 必填：群机器人 Webhook URL
  webhookUrl: '',

  // 可选：在 markdown 消息里 @ 这些手机号对应的群成员
  // 留空则不 @；填 '@all' 则 @ 全体成员（仅 markdown 支持文本中 <@手机号> 的写法，
  // 而 mentioned_mobile_list 是 text 消息字段，这里我们走 markdown，所以使用文本嵌入）
  mentionMobileList: [],

  // 标题模板（仅出现在 markdown 标题），可用变量 {projectName} {version} {date}
  titleTemplate: '【小程序预览】{projectName} v{version}',

  // 是否在文字之后再发一条二维码图片消息
  sendQrImage: true,
};
