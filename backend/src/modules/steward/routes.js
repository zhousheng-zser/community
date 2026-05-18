const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const ctrl = require('./controllers/steward.controller');

router.use(authMiddleware);

router.post('/apply', ctrl.apply);
router.get('/application/me', ctrl.getMyApplication);
router.get('/profile/me', ctrl.getMyProfile);
router.get('/applications', ctrl.getApplications);
router.post('/applications/:id/review', ctrl.reviewApplication);

module.exports = router;
