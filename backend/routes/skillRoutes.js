const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { getMySkills, addSkill, removeSkill } = require('../controllers/skillController');

router.get('/skills', authMiddleware, requireRole('student'), getMySkills);
router.post('/skills', authMiddleware, requireRole('student'), addSkill);
router.delete('/skills/:skillName', authMiddleware, requireRole('student'), removeSkill);

module.exports = router;
