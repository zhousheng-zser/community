# 微信小程序可调用的静态图片 URL 说明（原 `/root/community-backend/tmp` 已迁入）

## 说明

- 图片已移动到后端静态目录：`backend/data/uploads/images/` 下各子文件夹。
- 与数据库里已有图片一致，HTTP 路径前缀为 **`/uploads/`**（见 `backend/src/index.js` 中 `express.static`）。
- 请将下文中的 `<服务器IP或域名>` 换成你阿里云 ECS 的公网 IP 或已解析的域名；端口默认为 **3000**（与 `backend/.env` 中 `PORT` 一致，若前面有 Nginx 反代可写 80/443 且去掉端口）。
- 含中文、空格的文件名在小程序里请使用 **编码后的 URL**（下表「编码后完整 URL」列），或与 Web 一样使用 UTF-8 路径（视客户端而定，编码 URL 最稳妥）。

## 汇总

- 图片文件总数：**104**

## 每张图片的访问地址

| # | 相对路径（相对 `data/uploads/images`） | 编码后完整 URL（示例） |
|---|----------------------------------------|-------------------------|
| 1 | `benefit_alliance/jd-alliance.png` | `http://<服务器IP或域名>:3000/uploads/benefit_alliance/jd-alliance.png` |
| 2 | `benefit_alliance/pdd-alliance.png` | `http://<服务器IP或域名>:3000/uploads/benefit_alliance/pdd-alliance.png` |
| 3 | `home_service_photos/aircon.png` | `http://<服务器IP或域名>:3000/uploads/home_service_photos/aircon.png` |
| 4 | `home_service_photos/daily_clean.png` | `http://<服务器IP或域名>:3000/uploads/home_service_photos/daily_clean.png` |
| 5 | `home_service_photos/heater.png` | `http://<服务器IP或域名>:3000/uploads/home_service_photos/heater.png` |
| 6 | `home_service_photos/hood.png` | `http://<服务器IP或域名>:3000/uploads/home_service_photos/hood.png` |
| 7 | `home_service_photos/washer.png` | `http://<服务器IP或域名>:3000/uploads/home_service_photos/washer.png` |
| 8 | `jd_benefit/c14OhB8.png` | `http://<服务器IP或域名>:3000/uploads/jd_benefit/c14OhB8.png` |
| 9 | `jd_benefit/c14zUDW.png` | `http://<服务器IP或域名>:3000/uploads/jd_benefit/c14zUDW.png` |
| 10 | `jd_benefit/c64wRk8.png` | `http://<服务器IP或域名>:3000/uploads/jd_benefit/c64wRk8.png` |
| 11 | `jd_benefit/cG4nIbb.png` | `http://<服务器IP或域名>:3000/uploads/jd_benefit/cG4nIbb.png` |
| 12 | `jd_benefit/cG4vgVg.png` | `http://<服务器IP或域名>:3000/uploads/jd_benefit/cG4vgVg.png` |
| 13 | `jd_benefit/cO4Gh0k.png` | `http://<服务器IP或域名>:3000/uploads/jd_benefit/cO4Gh0k.png` |
| 14 | `jd_benefit/cg409N9.png` | `http://<服务器IP或域名>:3000/uploads/jd_benefit/cg409N9.png` |
| 15 | `jd_benefit/cg4pcQF.png` | `http://<服务器IP或域名>:3000/uploads/jd_benefit/cg4pcQF.png` |
| 16 | `pdd_benefit/6tA3bfap.jpeg` | `http://<服务器IP或域名>:3000/uploads/pdd_benefit/6tA3bfap.jpeg` |
| 17 | `pdd_benefit/OF53r22C.jpeg` | `http://<服务器IP或域名>:3000/uploads/pdd_benefit/OF53r22C.jpeg` |
| 18 | `pdd_benefit/QE73xVwd.jpeg` | `http://<服务器IP或域名>:3000/uploads/pdd_benefit/QE73xVwd.jpeg` |
| 19 | `pdd_benefit/VRM3IEUm.jpeg` | `http://<服务器IP或域名>:3000/uploads/pdd_benefit/VRM3IEUm.jpeg` |
| 20 | `pdd_benefit/Vvs3caRv.jpeg` | `http://<服务器IP或域名>:3000/uploads/pdd_benefit/Vvs3caRv.jpeg` |
| 21 | `pdd_benefit/bIn3iHWL.jpeg` | `http://<服务器IP或域名>:3000/uploads/pdd_benefit/bIn3iHWL.jpeg` |
| 22 | `pdd_benefit/jKH3Fh91.jpeg` | `http://<服务器IP或域名>:3000/uploads/pdd_benefit/jKH3Fh91.jpeg` |
| 23 | `pdd_benefit/nbf3xg02.jpeg` | `http://<服务器IP或域名>:3000/uploads/pdd_benefit/nbf3xg02.jpeg` |
| 24 | `service_home3/上门手机维修.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E4%B8%8A%E9%97%A8%E6%89%8B%E6%9C%BA%E7%BB%B4%E4%BF%AE.png` |
| 25 | `service_home3/上门纹绣咨询与设计.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E4%B8%8A%E9%97%A8%E7%BA%B9%E7%BB%A3%E5%92%A8%E8%AF%A2%E4%B8%8E%E8%AE%BE%E8%AE%A1.png` |
| 26 | `service_home3/上门美发造型服务.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E4%B8%8A%E9%97%A8%E7%BE%8E%E5%8F%91%E9%80%A0%E5%9E%8B%E6%9C%8D%E5%8A%A1.png` |
| 27 | `service_home3/上门美甲基础款.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E4%B8%8A%E9%97%A8%E7%BE%8E%E7%94%B2%E5%9F%BA%E7%A1%80%E6%AC%BE.png` |
| 28 | `service_home3/上门美瞳搭配服务.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E4%B8%8A%E9%97%A8%E7%BE%8E%E7%9E%B3%E6%90%AD%E9%85%8D%E6%9C%8D%E5%8A%A1.png` |
| 29 | `service_home3/上门面部护理美容.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E4%B8%8A%E9%97%A8%E9%9D%A2%E9%83%A8%E6%8A%A4%E7%90%86%E7%BE%8E%E5%AE%B9.png` |
| 30 | `service_home3/专业育儿嫂上门.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E4%B8%93%E4%B8%9A%E8%82%B2%E5%84%BF%E5%AB%82%E4%B8%8A%E9%97%A8.png` |
| 31 | `service_home3/儿童起居照顾.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%84%BF%E7%AB%A5%E8%B5%B7%E5%B1%85%E7%85%A7%E9%A1%BE.png` |
| 32 | `service_home3/全屋整理收纳.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%85%A8%E5%B1%8B%E6%95%B4%E7%90%86%E6%94%B6%E7%BA%B3.png` |
| 33 | `service_home3/全屋深度开荒.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%85%A8%E5%B1%8B%E6%B7%B1%E5%BA%A6%E5%BC%80%E8%8D%92.png` |
| 34 | `service_home3/全屋漏水点检测.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%85%A8%E5%B1%8B%E6%BC%8F%E6%B0%B4%E7%82%B9%E6%A3%80%E6%B5%8B.png` |
| 35 | `service_home3/全床深度除螨.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%85%A8%E5%BA%8A%E6%B7%B1%E5%BA%A6%E9%99%A4%E8%9E%A8.png` |
| 36 | `service_home3/冰箱除菌清洗.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%86%B0%E7%AE%B1%E9%99%A4%E8%8F%8C%E6%B8%85%E6%B4%97.png` |
| 37 | `service_home3/净水器故障维修.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%87%80%E6%B0%B4%E5%99%A8%E6%95%85%E9%9A%9C%E7%BB%B4%E4%BF%AE.png` |
| 38 | `service_home3/卫浴管道疏通.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%8D%AB%E6%B5%B4%E7%AE%A1%E9%81%93%E7%96%8F%E9%80%9A.png` |
| 39 | `service_home3/厨卫漏水防水修缮.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%8E%A8%E5%8D%AB%E6%BC%8F%E6%B0%B4%E9%98%B2%E6%B0%B4%E4%BF%AE%E7%BC%AE.png` |
| 40 | `service_home3/厨房_卫浴管道疏通.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%8E%A8%E6%88%BF_%E5%8D%AB%E6%B5%B4%E7%AE%A1%E9%81%93%E7%96%8F%E9%80%9A.png` |
| 41 | `service_home3/厨房整理收纳.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%8E%A8%E6%88%BF%E6%95%B4%E7%90%86%E6%94%B6%E7%BA%B3.png` |
| 42 | `service_home3/厨房烟道串味治理.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%8E%A8%E6%88%BF%E7%83%9F%E9%81%93%E4%B8%B2%E5%91%B3%E6%B2%BB%E7%90%86.png` |
| 43 | `service_home3/厨房管道疏通.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%8E%A8%E6%88%BF%E7%AE%A1%E9%81%93%E7%96%8F%E9%80%9A.png` |
| 44 | `service_home3/地暖回路检测.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%9C%B0%E6%9A%96%E5%9B%9E%E8%B7%AF%E6%A3%80%E6%B5%8B.png` |
| 45 | `service_home3/地暖管路清洗.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%9C%B0%E6%9A%96%E7%AE%A1%E8%B7%AF%E6%B8%85%E6%B4%97.png` |
| 46 | `service_home3/地暖系统检测.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%9C%B0%E6%9A%96%E7%B3%BB%E7%BB%9F%E6%A3%80%E6%B5%8B.png` |
| 47 | `service_home3/地暖系统清洁.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%9C%B0%E6%9A%96%E7%B3%BB%E7%BB%9F%E6%B8%85%E6%B4%81.png` |
| 48 | `service_home3/地板打蜡养护.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%9C%B0%E6%9D%BF%E6%89%93%E8%9C%A1%E5%85%BB%E6%8A%A4.png` |
| 49 | `service_home3/地板铺贴修缮.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%9C%B0%E6%9D%BF%E9%93%BA%E8%B4%B4%E4%BF%AE%E7%BC%AE.png` |
| 50 | `service_home3/地毯深度清洗.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%9C%B0%E6%AF%AF%E6%B7%B1%E5%BA%A6%E6%B8%85%E6%B4%97.png` |
| 51 | `service_home3/墙面修补刷新.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%A2%99%E9%9D%A2%E4%BF%AE%E8%A1%A5%E5%88%B7%E6%96%B0.png` |
| 52 | `service_home3/墙面刷新施工.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%A2%99%E9%9D%A2%E5%88%B7%E6%96%B0%E6%96%BD%E5%B7%A5.png` |
| 53 | `service_home3/壁纸铺贴施工.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%A3%81%E7%BA%B8%E9%93%BA%E8%B4%B4%E6%96%BD%E5%B7%A5.png` |
| 54 | `service_home3/大理石抛光养护.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%A4%A7%E7%90%86%E7%9F%B3%E6%8A%9B%E5%85%89%E5%85%BB%E6%8A%A4.png` |
| 55 | `service_home3/家庭水路维修.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%AE%B6%E5%BA%AD%E6%B0%B4%E8%B7%AF%E7%BB%B4%E4%BF%AE.png` |
| 56 | `service_home3/家庭电路故障维修.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%AE%B6%E5%BA%AD%E7%94%B5%E8%B7%AF%E6%95%85%E9%9A%9C%E7%BB%B4%E4%BF%AE.png` |
| 57 | `service_home3/局部瓷砖铺贴.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%B1%80%E9%83%A8%E7%93%B7%E7%A0%96%E9%93%BA%E8%B4%B4.png` |
| 58 | `service_home3/居室除螨净化.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%B1%85%E5%AE%A4%E9%99%A4%E8%9E%A8%E5%87%80%E5%8C%96.png` |
| 59 | `service_home3/岩板破损修复.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%B2%A9%E6%9D%BF%E7%A0%B4%E6%8D%9F%E4%BF%AE%E5%A4%8D.png` |
| 60 | `service_home3/布艺_皮质沙发清洗.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%B8%83%E8%89%BA_%E7%9A%AE%E8%B4%A8%E6%B2%99%E5%8F%91%E6%B8%85%E6%B4%97.png` |
| 61 | `service_home3/床垫深度清洗除菌.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E5%BA%8A%E5%9E%AB%E6%B7%B1%E5%BA%A6%E6%B8%85%E6%B4%97%E9%99%A4%E8%8F%8C.png` |
| 62 | `service_home3/接送小孩.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E6%8E%A5%E9%80%81%E5%B0%8F%E5%AD%A9.png` |
| 63 | `service_home3/新房开荒保洁.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E6%96%B0%E6%88%BF%E5%BC%80%E8%8D%92%E4%BF%9D%E6%B4%81.png` |
| 64 | `service_home3/日式打包复原整理.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E6%97%A5%E5%BC%8F%E6%89%93%E5%8C%85%E5%A4%8D%E5%8E%9F%E6%95%B4%E7%90%86.png` |
| 65 | `service_home3/木地板翻新养护.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E6%9C%A8%E5%9C%B0%E6%9D%BF%E7%BF%BB%E6%96%B0%E5%85%BB%E6%8A%A4.png` |
| 66 | `service_home3/柜门铰链滑轨维修.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E6%9F%9C%E9%97%A8%E9%93%B0%E9%93%BE%E6%BB%91%E8%BD%A8%E7%BB%B4%E4%BF%AE.png` |
| 67 | `service_home3/油烟机拆洗.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E6%B2%B9%E7%83%9F%E6%9C%BA%E6%8B%86%E6%B4%97.png` |
| 68 | `service_home3/洗衣机桶内清洗.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E6%B4%97%E8%A1%A3%E6%9C%BA%E6%A1%B6%E5%86%85%E6%B8%85%E6%B4%97.png` |
| 69 | `service_home3/活动化妆造型.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E6%B4%BB%E5%8A%A8%E5%8C%96%E5%A6%86%E9%80%A0%E5%9E%8B.png` |
| 70 | `service_home3/灯具深度清洗.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E7%81%AF%E5%85%B7%E6%B7%B1%E5%BA%A6%E6%B8%85%E6%B4%97.png` |
| 71 | `service_home3/灯具线路与灯体维修.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E7%81%AF%E5%85%B7%E7%BA%BF%E8%B7%AF%E4%B8%8E%E7%81%AF%E4%BD%93%E7%BB%B4%E4%BF%AE.png` |
| 72 | `service_home3/热水器内胆清洗.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E7%83%AD%E6%B0%B4%E5%99%A8%E5%86%85%E8%83%86%E6%B8%85%E6%B4%97.png` |
| 73 | `service_home3/瓷砖空鼓排查检测.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E7%93%B7%E7%A0%96%E7%A9%BA%E9%BC%93%E6%8E%92%E6%9F%A5%E6%A3%80%E6%B5%8B.png` |
| 74 | `service_home3/瓷砖裂纹修复.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E7%93%B7%E7%A0%96%E8%A3%82%E7%BA%B9%E4%BF%AE%E5%A4%8D.png` |
| 75 | `service_home3/空调深度清洗.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E7%A9%BA%E8%B0%83%E6%B7%B1%E5%BA%A6%E6%B8%85%E6%B4%97.png` |
| 76 | `service_home3/窗帘清洁养护.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E7%AA%97%E5%B8%98%E6%B8%85%E6%B4%81%E5%85%BB%E6%8A%A4.png` |
| 77 | `service_home3/衣橱收纳.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E8%A1%A3%E6%A9%B1%E6%94%B6%E7%BA%B3.png` |
| 78 | `service_home3/课后辅导.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E8%AF%BE%E5%90%8E%E8%BE%85%E5%AF%BC.png` |
| 79 | `service_home3/零星打胶.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E9%9B%B6%E6%98%9F%E6%89%93%E8%83%B6.png` |
| 80 | `service_home3/马桶维修与配件更换.png` | `http://<服务器IP或域名>:3000/uploads/service_home3/%E9%A9%AC%E6%A1%B6%E7%BB%B4%E4%BF%AE%E4%B8%8E%E9%85%8D%E4%BB%B6%E6%9B%B4%E6%8D%A2.png` |
| 81 | `worker_avatars/1.png` | `http://<服务器IP或域名>:3000/uploads/worker_avatars/1.png` |
| 82 | `worker_avatars/2.png` | `http://<服务器IP或域名>:3000/uploads/worker_avatars/2.png` |
| 83 | `worker_avatars/3.png` | `http://<服务器IP或域名>:3000/uploads/worker_avatars/3.png` |
| 84 | `worker_avatars/4.png` | `http://<服务器IP或域名>:3000/uploads/worker_avatars/4.png` |
| 85 | `worker_avatars/5.png` | `http://<服务器IP或域名>:3000/uploads/worker_avatars/5.png` |
| 86 | `worker_avatars/6.png` | `http://<服务器IP或域名>:3000/uploads/worker_avatars/6.png` |
| 87 | `京东联盟/Screenshot 2026-04-03 at 21-42-38 伊利【新鲜日期】纯牛奶250ml 21盒 早餐奶 财神装普通礼盒装混发【行情 报价 价格 评测】-京东.png` | `http://<服务器IP或域名>:3000/uploads/%E4%BA%AC%E4%B8%9C%E8%81%94%E7%9B%9F/Screenshot%202026-04-03%20at%2021-42-38%20%E4%BC%8A%E5%88%A9%E3%80%90%E6%96%B0%E9%B2%9C%E6%97%A5%E6%9C%9F%E3%80%91%E7%BA%AF%E7%89%9B%E5%A5%B6250ml%2021%E7%9B%92%20%E6%97%A9%E9%A4%90%E5%A5%B6%20%E8%B4%A2%E7%A5%9E%E8%A3%85%E6%99%AE%E9%80%9A%E7%A4%BC%E7%9B%92%E8%A3%85%E6%B7%B7%E5%8F%91%E3%80%90%E8%A1%8C%E6%83%85%20%E6%8A%A5%E4%BB%B7%20%E4%BB%B7%E6%A0%BC%20%E8%AF%84%E6%B5%8B%E3%80%91-%E4%BA%AC%E4%B8%9C.png` |
| 88 | `京东联盟/Screenshot 2026-04-03 at 21-42-58 雪亮500张大包抽纸优等品5层加厚纸巾大尺寸面巾纸餐巾纸可湿水卫生纸 5层 500张 20包【行情 报价 价格 评测】-京东.png` | `http://<服务器IP或域名>:3000/uploads/%E4%BA%AC%E4%B8%9C%E8%81%94%E7%9B%9F/Screenshot%202026-04-03%20at%2021-42-58%20%E9%9B%AA%E4%BA%AE500%E5%BC%A0%E5%A4%A7%E5%8C%85%E6%8A%BD%E7%BA%B8%E4%BC%98%E7%AD%89%E5%93%815%E5%B1%82%E5%8A%A0%E5%8E%9A%E7%BA%B8%E5%B7%BE%E5%A4%A7%E5%B0%BA%E5%AF%B8%E9%9D%A2%E5%B7%BE%E7%BA%B8%E9%A4%90%E5%B7%BE%E7%BA%B8%E5%8F%AF%E6%B9%BF%E6%B0%B4%E5%8D%AB%E7%94%9F%E7%BA%B8%205%E5%B1%82%20500%E5%BC%A0%2020%E5%8C%85%E3%80%90%E8%A1%8C%E6%83%85%20%E6%8A%A5%E4%BB%B7%20%E4%BB%B7%E6%A0%BC%20%E8%AF%84%E6%B5%8B%E3%80%91-%E4%BA%AC%E4%B8%9C.png` |
| 89 | `京东联盟/Screenshot 2026-04-03 at 21-43-41 鲜京采 30_40厄瓜多尔白虾 去冰净重3.3斤 50-66只_盒 【行情 报价 价格 评测】-京东.png` | `http://<服务器IP或域名>:3000/uploads/%E4%BA%AC%E4%B8%9C%E8%81%94%E7%9B%9F/Screenshot%202026-04-03%20at%2021-43-41%20%E9%B2%9C%E4%BA%AC%E9%87%87%2030_40%E5%8E%84%E7%93%9C%E5%A4%9A%E5%B0%94%E7%99%BD%E8%99%BE%20%E5%8E%BB%E5%86%B0%E5%87%80%E9%87%8D3.3%E6%96%A4%2050-66%E5%8F%AA_%E7%9B%92%20%E3%80%90%E8%A1%8C%E6%83%85%20%E6%8A%A5%E4%BB%B7%20%E4%BB%B7%E6%A0%BC%20%E8%AF%84%E6%B5%8B%E3%80%91-%E4%BA%AC%E4%B8%9C.png` |
| 90 | `京东联盟/Screenshot 2026-04-03 at 21-44-32 圣上用膳五常大米 10斤 GB_T 19266 五常香米 当季新米 东北大米【行情 报价 价格 评测】-京东.png` | `http://<服务器IP或域名>:3000/uploads/%E4%BA%AC%E4%B8%9C%E8%81%94%E7%9B%9F/Screenshot%202026-04-03%20at%2021-44-32%20%E5%9C%A3%E4%B8%8A%E7%94%A8%E8%86%B3%E4%BA%94%E5%B8%B8%E5%A4%A7%E7%B1%B3%2010%E6%96%A4%20GB_T%2019266%20%E4%BA%94%E5%B8%B8%E9%A6%99%E7%B1%B3%20%E5%BD%93%E5%AD%A3%E6%96%B0%E7%B1%B3%20%E4%B8%9C%E5%8C%97%E5%A4%A7%E7%B1%B3%E3%80%90%E8%A1%8C%E6%83%85%20%E6%8A%A5%E4%BB%B7%20%E4%BB%B7%E6%A0%BC%20%E8%AF%84%E6%B5%8B%E3%80%91-%E4%BA%AC%E4%B8%9C.png` |
| 91 | `京东联盟/Screenshot 2026-04-03 at 21-45-02 京鲜生 四川春见耙耙柑 净重8.5-9斤水果礼盒 单果170g 源头直发包邮【行情 报价 价格 评测】-京东.png` | `http://<服务器IP或域名>:3000/uploads/%E4%BA%AC%E4%B8%9C%E8%81%94%E7%9B%9F/Screenshot%202026-04-03%20at%2021-45-02%20%E4%BA%AC%E9%B2%9C%E7%94%9F%20%E5%9B%9B%E5%B7%9D%E6%98%A5%E8%A7%81%E8%80%99%E8%80%99%E6%9F%91%20%E5%87%80%E9%87%8D8.5-9%E6%96%A4%E6%B0%B4%E6%9E%9C%E7%A4%BC%E7%9B%92%20%E5%8D%95%E6%9E%9C170g%20%E6%BA%90%E5%A4%B4%E7%9B%B4%E5%8F%91%E5%8C%85%E9%82%AE%E3%80%90%E8%A1%8C%E6%83%85%20%E6%8A%A5%E4%BB%B7%20%E4%BB%B7%E6%A0%BC%20%E8%AF%84%E6%B5%8B%E3%80%91-%E4%BA%AC%E4%B8%9C.png` |
| 92 | `京东联盟/Screenshot 2026-04-03 at 21-45-38 伊利【新鲜日期】金典纯牛奶早餐奶250ml 16 3.6g乳蛋白 礼盒装 2-3月【行情 报价 价格 评测】-京东.png` | `http://<服务器IP或域名>:3000/uploads/%E4%BA%AC%E4%B8%9C%E8%81%94%E7%9B%9F/Screenshot%202026-04-03%20at%2021-45-38%20%E4%BC%8A%E5%88%A9%E3%80%90%E6%96%B0%E9%B2%9C%E6%97%A5%E6%9C%9F%E3%80%91%E9%87%91%E5%85%B8%E7%BA%AF%E7%89%9B%E5%A5%B6%E6%97%A9%E9%A4%90%E5%A5%B6250ml%2016%203.6g%E4%B9%B3%E8%9B%8B%E7%99%BD%20%E7%A4%BC%E7%9B%92%E8%A3%85%202-3%E6%9C%88%E3%80%90%E8%A1%8C%E6%83%85%20%E6%8A%A5%E4%BB%B7%20%E4%BB%B7%E6%A0%BC%20%E8%AF%84%E6%B5%8B%E3%80%91-%E4%BA%AC%E4%B8%9C.png` |
| 93 | `京东联盟/Screenshot 2026-04-03 at 21-46-36 漫花山茶花大包抽纸纸巾大尺寸餐巾纸面巾纸家用卫生纸原木纸抽纸C 山茶花抽纸 5层 400张 6包【行情 报价 价格 评测】-京东.png` | `http://<服务器IP或域名>:3000/uploads/%E4%BA%AC%E4%B8%9C%E8%81%94%E7%9B%9F/Screenshot%202026-04-03%20at%2021-46-36%20%E6%BC%AB%E8%8A%B1%E5%B1%B1%E8%8C%B6%E8%8A%B1%E5%A4%A7%E5%8C%85%E6%8A%BD%E7%BA%B8%E7%BA%B8%E5%B7%BE%E5%A4%A7%E5%B0%BA%E5%AF%B8%E9%A4%90%E5%B7%BE%E7%BA%B8%E9%9D%A2%E5%B7%BE%E7%BA%B8%E5%AE%B6%E7%94%A8%E5%8D%AB%E7%94%9F%E7%BA%B8%E5%8E%9F%E6%9C%A8%E7%BA%B8%E6%8A%BD%E7%BA%B8C%20%E5%B1%B1%E8%8C%B6%E8%8A%B1%E6%8A%BD%E7%BA%B8%205%E5%B1%82%20400%E5%BC%A0%206%E5%8C%85%E3%80%90%E8%A1%8C%E6%83%85%20%E6%8A%A5%E4%BB%B7%20%E4%BB%B7%E6%A0%BC%20%E8%AF%84%E6%B5%8B%E3%80%91-%E4%BA%AC%E4%B8%9C.png` |
| 94 | `京东联盟/Screenshot 2026-04-03 at 21-47-08 广东徐闻香水菠萝新鲜水果生鲜热带孕妇水果整箱包邮 【限时低价】1个装 净重650g起【行情 报价 价格 评测】-京东.png` | `http://<服务器IP或域名>:3000/uploads/%E4%BA%AC%E4%B8%9C%E8%81%94%E7%9B%9F/Screenshot%202026-04-03%20at%2021-47-08%20%E5%B9%BF%E4%B8%9C%E5%BE%90%E9%97%BB%E9%A6%99%E6%B0%B4%E8%8F%A0%E8%90%9D%E6%96%B0%E9%B2%9C%E6%B0%B4%E6%9E%9C%E7%94%9F%E9%B2%9C%E7%83%AD%E5%B8%A6%E5%AD%95%E5%A6%87%E6%B0%B4%E6%9E%9C%E6%95%B4%E7%AE%B1%E5%8C%85%E9%82%AE%20%E3%80%90%E9%99%90%E6%97%B6%E4%BD%8E%E4%BB%B7%E3%80%911%E4%B8%AA%E8%A3%85%20%E5%87%80%E9%87%8D650g%E8%B5%B7%E3%80%90%E8%A1%8C%E6%83%85%20%E6%8A%A5%E4%BB%B7%20%E4%BB%B7%E6%A0%BC%20%E8%AF%84%E6%B5%8B%E3%80%91-%E4%BA%AC%E4%B8%9C.png` |
| 95 | `拼多多/Zippo秋水含睛保温杯女.jpeg` | `http://<服务器IP或域名>:3000/uploads/%E6%8B%BC%E5%A4%9A%E5%A4%9A/Zippo%E7%A7%8B%E6%B0%B4%E5%90%AB%E7%9D%9B%E4%BF%9D%E6%B8%A9%E6%9D%AF%E5%A5%B3.jpeg` |
| 96 | `拼多多/保暖圆领上衣.jpeg` | `http://<服务器IP或域名>:3000/uploads/%E6%8B%BC%E5%A4%9A%E5%A4%9A/%E4%BF%9D%E6%9A%96%E5%9C%86%E9%A2%86%E4%B8%8A%E8%A1%A3.jpeg` |
| 97 | `拼多多/匹克态极维金斯天赋一代篮球鞋球鞋.jpeg` | `http://<服务器IP或域名>:3000/uploads/%E6%8B%BC%E5%A4%9A%E5%A4%9A/%E5%8C%B9%E5%85%8B%E6%80%81%E6%9E%81%E7%BB%B4%E9%87%91%E6%96%AF%E5%A4%A9%E8%B5%8B%E4%B8%80%E4%BB%A3%E7%AF%AE%E7%90%83%E9%9E%8B%E7%90%83%E9%9E%8B.jpeg` |
| 98 | `拼多多/得宝抽纸.jpeg` | `http://<服务器IP或域名>:3000/uploads/%E6%8B%BC%E5%A4%9A%E5%A4%9A/%E5%BE%97%E5%AE%9D%E6%8A%BD%E7%BA%B8.jpeg` |
| 99 | `拼多多/心相印抽纸.jpeg` | `http://<服务器IP或域名>:3000/uploads/%E6%8B%BC%E5%A4%9A%E5%A4%9A/%E5%BF%83%E7%9B%B8%E5%8D%B0%E6%8A%BD%E7%BA%B8.jpeg` |
| 100 | `拼多多/新款雪尼尔平板拖把.jpeg` | `http://<服务器IP或域名>:3000/uploads/%E6%8B%BC%E5%A4%9A%E5%A4%9A/%E6%96%B0%E6%AC%BE%E9%9B%AA%E5%B0%BC%E5%B0%94%E5%B9%B3%E6%9D%BF%E6%8B%96%E6%8A%8A.jpeg` |
| 101 | `拼多多/白象经典拌面火鸡面.jpeg` | `http://<服务器IP或域名>:3000/uploads/%E6%8B%BC%E5%A4%9A%E5%A4%9A/%E7%99%BD%E8%B1%A1%E7%BB%8F%E5%85%B8%E6%8B%8C%E9%9D%A2%E7%81%AB%E9%B8%A1%E9%9D%A2.jpeg` |
| 102 | `拼多多/遮瑕鼻影刷.jpeg` | `http://<服务器IP或域名>:3000/uploads/%E6%8B%BC%E5%A4%9A%E5%A4%9A/%E9%81%AE%E7%91%95%E9%BC%BB%E5%BD%B1%E5%88%B7.jpeg` |
| 103 | `流量联盟/京东联盟.png` | `http://<服务器IP或域名>:3000/uploads/%E6%B5%81%E9%87%8F%E8%81%94%E7%9B%9F/%E4%BA%AC%E4%B8%9C%E8%81%94%E7%9B%9F.png` |
| 104 | `流量联盟/拼多多.png` | `http://<服务器IP或域名>:3000/uploads/%E6%B5%81%E9%87%8F%E8%81%94%E7%9B%9F/%E6%8B%BC%E5%A4%9A%E5%A4%9A.png` |
