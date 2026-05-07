const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const ctrl = require('./controllers/message.controller');

router.use(authMiddleware);

router.get('/conversations', ctrl.getConversations);
router.get('/history/:conversationId', ctrl.getHistory);
router.delete('/conversations/:conversationId', ctrl.deleteConversation);
router.post('/send', ctrl.sendMessage);
router.post('/order-conversation/ensure', ctrl.ensureOrderConversation);
router.post('/broadcast', ctrl.broadcast);

module.exports = router;
