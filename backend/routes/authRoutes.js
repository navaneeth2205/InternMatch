const express = require('express');
const router = express.Router();
const { register, login, getCompanyProfile, updateCompanyProfile } = require('../controllers/authController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/company/profile', authMiddleware, requireRole('company'), getCompanyProfile);
router.put('/company/profile', authMiddleware, requireRole('company'), updateCompanyProfile);

module.exports = router;
