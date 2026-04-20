/**
 * 商家端商品与库存：/api/v1/market/merchant/goods* 与 /api/v1/market/shop/goods*（前端降级路径）
 */
const express = require('express');
const c = require('../controllers/merchantGoodsController');

const router = express.Router();

function requireBearer(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ') || auth.length < 12) {
    return res.status(401).json({ errno: 401, errmsg: '请先登录' });
  }
  next();
}

router.use(requireBearer);

router.get('/goods/:id', c.getGoods);
router.patch('/goods/:id', c.patchGoods);
router.get('/goods', c.listGoods);
router.post('/goods/:id/restock', c.postRestock);
router.post('/goods/:id/shelf', c.postShelf);

module.exports = router;
