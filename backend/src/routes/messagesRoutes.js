/**
 * 消息与订单会话：/api/v1/messages/*
 */
const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const c = require('../controllers/messagesController');

const router = express.Router();

function requireBearer(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ') || auth.length < 12) {
    return res.status(401).json({ errno: 401, errmsg: '请先登录' });
  }
  next();
}

const uploadDir = path.join(__dirname, '../../data/uploads/images/chat');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (e) {}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.jpg';
    cb(null, `chat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(requireBearer);

router.get('/conversations', c.listConversations);
router.get('/rider-location', c.getRiderLocation);
router.get('/history/:conversationId', c.getHistory);
router.post('/send', express.json(), c.sendMessage);
router.post('/order-conversation/ensure', express.json(), c.ensureOrderConversation);
router.delete('/conversations/:conversationId', c.deleteConversation);
router.post('/upload', upload.single('file'), c.uploadImage);

module.exports = router;
