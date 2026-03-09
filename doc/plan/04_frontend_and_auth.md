# 第四阶段：小程序前端改造与安全授权

当服务器的“大基建”搭好且拥有了数据库支持后，前端小程序的首页面貌也将迎来改头换面。我们需要完成两件最重要的事：**数据真实化改写**与**身份鉴权安全**。

## 1. 原生组件与假数据的清退改造

- 逐个页面寻找写死在 `js` 顶部或者 `data: {}` 中的 mock 数据。
- **改写方案**：
  在 `onLoad` 以及下拉刷新 `onPullDownRefresh`（或原先写好的 `onReachBottom`）内：
  ```javascript
  wx.request({
    url: 'https://您的域名.com/api/feed/list', // 替换本地数组
    method: 'GET',
    data: { page: this.data.pageIndex, category: this.data.activeFeedTab },
    success: (res) => {
      // 成功获得网上的真实图片和详情啦！
      this.setData({
         pushFeedGoods: this.data.pageIndex === 1 ? res.data : this.data.pushFeedGoods.concat(res.data)
      });
    }
  });
  ```
- **完善加载态**：前端配合使用 `wx.showNavigationBarLoading()`、骨架屏（Skeleton）或空白图提示，以提升真实网络由于延迟带来的等待体验。

## 2. 身份基石：微信授权登录体系接入

“我的模块”不再是一个花架子。我们要实打实地抓取访问者的微信身份证，以此追踪其发贴、消费与提现记录。

### 执行流程：

1. **静默拉取**：程序一拉起，前端偷偷调用 `wx.login` 获得临时 `code` 发给 Node.js。
2. **拿取令牌**：Node.js 给微信服务器验证这串 `code`，成功换到 `OpenID`、`SessionKey` 以及后续如果用户同意还能获取`UnionID`。
3. **注册或签发身份**：Node.js 在数据库建立一条这个 OpenID 的玩家记录。将它用 `JWT` 签名包装成一个自己可读的 Token。抛回给前端。
4. **前端挂载验证**：前端在 `wx.setStorageSync('token', token)` 持久化。以后只要向后端请求下单或者发视频，全部带上它。
5. **获取头像与手机号**：对于商品买卖类业务：若必须要获取收货隐私联系方式等真实信息，前端需通过 `<button open-type="getPhoneNumber">` 让用户主动点同意授权。此步骤需要在微信小程序后台**提前申请使用该组件的权限**。
