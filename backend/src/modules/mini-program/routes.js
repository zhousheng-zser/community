const express = require('express');
const router = express.Router();
const miniProgramController = require('./controllers/miniProgram.controller');

// GET list/detail - public (no auth required)
router.get('/', miniProgramController.getMiniPrograms);
router.get('/:id', miniProgramController.getMiniProgramDetail);

// CRUD - admin (no auth middleware here; frontend handles via admin login)
router.post('/', miniProgramController.createMiniProgram);
router.put('/:id', miniProgramController.updateMiniProgram);
router.delete('/:id', miniProgramController.deleteMiniProgram);

module.exports = router;
