const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { applyToInternship, getApplications, updateApplicationStatus, getMyApplications, withdrawApplication } = require('../controllers/applicationController');

// Student: Apply to internship
router.post('/apply', authMiddleware, requireRole('student'), applyToInternship);

// Student: View own applications
router.get('/my', authMiddleware, requireRole('student'), getMyApplications);

// Student: Withdraw application
router.delete('/withdraw/:id', authMiddleware, requireRole('student'), withdrawApplication);

// Company: View received applications
router.get('/', authMiddleware, requireRole('company'), getApplications);

// Company: Update application status (Accept/Reject)
router.put('/:id', authMiddleware, requireRole('company'), updateApplicationStatus);

module.exports = router;
