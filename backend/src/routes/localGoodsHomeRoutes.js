const express = require('express');
const router = express.Router();
const localGoodsHomeController = require('../controllers/localGoodsHomeController');

router.get('/ui-assets', localGoodsHomeController.getUiAssets);
router.get('/modules', localGoodsHomeController.getModules);
router.get('/feed-products', localGoodsHomeController.getFeedProducts);
router.get('/zone-products', localGoodsHomeController.getZoneProducts);
router.get('/channel-products', localGoodsHomeController.getChannelProducts);
router.get('/brand-goods', localGoodsHomeController.getBrandGoods);
router.get('/jiuzhou-haoshi', localGoodsHomeController.getJiuzhouHaoshi);
router.get('/jiuzhou-haowu', localGoodsHomeController.getJiuzhouHaowu);
router.get('/jiuzhou-haowei', localGoodsHomeController.getJiuzhouHaowei);
router.get('/autumn-winter', localGoodsHomeController.getAutumnWinter);

router.get('/hot-zone', localGoodsHomeController.getHotZone);
router.get('/gift-zone', localGoodsHomeController.getGiftZone);
router.get('/pick-zone', localGoodsHomeController.getPickZone);
router.get('/high-comm-zone', localGoodsHomeController.getHighCommZone);

router.get('/daily-news', localGoodsHomeController.getDailyNews);
router.get('/top-sales', localGoodsHomeController.getTopSales);
router.get('/today-push', localGoodsHomeController.getTodayPush);
router.get('/week-select', localGoodsHomeController.getWeekSelect);

module.exports = router;
