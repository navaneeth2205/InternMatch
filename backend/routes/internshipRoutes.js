const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { getInternships, createInternship, updateInternship, deleteInternship } = require('../controllers/internshipController');

// Public: Get internships
router.get('/', getInternships);

// Company only: Create, Update, Delete
router.post('/', authMiddleware, requireRole('company'), createInternship);
router.put('/:id', authMiddleware, requireRole('company'), updateInternship);
router.delete('/:id', authMiddleware, requireRole('company'), deleteInternship);

module.exports = router;
