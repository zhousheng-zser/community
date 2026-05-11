const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const ctrl = require('./controllers/user.controller');

router.use(authMiddleware);

router.get('/profile', ctrl.getProfile);
router.patch('/profile', ctrl.updateProfile);
router.get('/addresses', ctrl.getAddresses);
router.post('/addresses', ctrl.addAddress);
router.post('/addresses/:id', ctrl.updateAddress);
router.delete('/addresses/:id', ctrl.deleteAddress);
router.get('/invite-code', ctrl.getInviteCode);
router.post('/bind-inviter', ctrl.bindInviter);
router.get('/invitees', ctrl.getInvitees);

module.exports = router;
