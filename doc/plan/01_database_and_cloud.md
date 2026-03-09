# 第一阶段：数据库设计与云存储接入机制

在小程序前端页面完备后，首要任务是建立坚实的数据底层。社区与带货小程序的特点是：**高并发读写（如点赞、评论）** 和 **大量媒体文件（如视频、商品头图）**。

## 1. 核心数据库 (RDBMS) 设计

建议采用 **MySQL** 或 **PostgreSQL** 作为核心关系型数据库。
主要需要设计和建立以下核心数据表模型：

1. **用户表 (`users`)**
   - 字段：`openid` (主键/核心索引), `unionid`, `nickname`, `avatar_url`, `phone`, `role` (普通用户/推广员/管理员), `balance` (账户可提现余额), `created_at`。
2. **商品表 (`goods`)**
   - 字段：`id`, `title`, `price` (真实支付价), `commission` (总返佣金额), `cover_image_url`, `status` (上架/下架), `stock` (库存), `category_id`。
   - 关联：可设置多张 SKU 子表处理不同规格。
3. **带货流/视频表 (`feeds` / `videos`)**
   - 字段：`id`, `type` (图文/短视频), `author_id`, `content`, `media_urls` (JSON 数组), `related_goods_id` (挂载的带货商品ID), `likes_count`, `views_count`, `created_at`。
4. **订单与账单表 (`orders`, `transactions`)**
   - `orders`: `order_no`, `user_id`, `goods_id`, `amount`, `status` (待支付/已支付/已发货/已结算返佣), `wx_pay_trade_no`。
   - `transactions`: 记录佣金收入及用户提现的每笔流水明细。

## 2. 云存储 (OSS/CDN) 方案规划

**背景**：严禁将商品大图和短视频放在应用服务器本地或小程序包内，会导致服务器带宽崩溃及小程序无法过审。

1. **选型**：推荐使用 **阿里云 OSS** + **CDN** 或 **腾讯云 COS**。
2. **开发流程**：
   - 在云平台上创建 Bucket（读写权限设为：公共读、私有写）。
   - Node.js 后端集成对应的云平台 SDK (`ali-oss` 或 `cos-nodejs-sdk-v5`)。
   - **上传链路**：
     1. 小程序前端通过 `wx.chooseMedia` 拍短视频或选图。
     2. 将文件通过 `wx.uploadFile` 传给 Node.js 后端。
     3. 后端向 OSS 发起流式上传，获取长久的 `https://cdn.xxx.com/xxx.jpg` 地址。
     4. 后端将这个 URL 保存进 MySQL 相应的 `image_url` 字段中。
3. **优化建议**：对于视频，可以在上传后触发云端的视频转码服务（例如转成自适应 HLS 或压缩 720p），以保证小程序端播放流畅。

## 下一步移交
完成库表结构 SQL 脚本生成及云厂商秘钥 (AccessKey) 配置对接。
