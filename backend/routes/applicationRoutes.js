const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { applyToInternship, getApplications, updateApplicationStatus, getMyApplications } = require('../controllers/applicationController');

// Student: Apply to internship
router.post('/apply', authMiddleware, requireRole('student'), applyToInternship);

// Student: View own applications
router.get('/my', authMiddleware, requireRole('student'), getMyApplications);

// Company: View received applications
router.get('/', authMiddleware, requireRole('company'), getApplications);

// Company: Update application status (Accept/Reject)
router.put('/:id', authMiddleware, requireRole('company'), updateApplicationStatus);

module.exports = router;
