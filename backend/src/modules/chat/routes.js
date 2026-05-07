const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const chatController = require('./controllers/chat.controller');

router.use(authMiddleware);

// Group management
router.get('/groups', chatController.getGroups);
router.post('/groups', chatController.createGroup);
router.get('/groups/:groupId', chatController.getGroupDetail);

// Group members
router.get('/groups/:groupId/members', chatController.getGroupMembers);
router.post('/groups/:groupId/members', chatController.addGroupMembers);
router.post('/groups/:groupId/members/:userId/remove', chatController.removeGroupMember);

// Group actions
router.post('/groups/:groupId/quit', chatController.quitGroup);
router.post('/groups/:groupId/dismiss', chatController.dismissGroup);

// Group messages
router.get('/groups/:groupId/messages', chatController.getGroupMessages);
router.post('/groups/:groupId/messages', chatController.sendGroupMessage);

// Follow
router.post('/follow/:userId', chatController.followUser);
router.post('/unfollow/:userId', chatController.unfollowUser);

module.exports = router;
