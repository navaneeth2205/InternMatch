// ============================================
// INTERNSHIP CONTROLLER
// CRUD operations for internships
// ============================================

const pool = require('../config/db');

// GET /api/internships — List internships (optionally filter by skill)
async function getInternships(req, res) {
  try {
    const { skill } = req.query;
    let query = `
      SELECT i.*, c.company_name 
      FROM internships i 
      JOIN companies c ON i.company_id = c.company_id 
      WHERE i.status = 'Active'
    `;
    let params = [];

    if (skill) {
      query += ' AND i.skill_required = ?';
      params.push(skill);
    }

    query += ' ORDER BY i.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get internships error:', err);
    res.status(500).json({ error: 'Failed to fetch internships.' });
  }
}

// POST /api/internships — Post a new internship (company only)
async function createInternship(req, res) {
  try {
    const userId = req.user.id;
    const { skill_required, stipend, location, duration, description } = req.body;

    if (!skill_required) {
      return res.status(400).json({ error: 'Skill required is mandatory.' });
    }

    const companyId = userId;

    const [result] = await pool.query(
      'INSERT INTO internships (company_id, skill_required, stipend, location, duration, description) VALUES (?, ?, ?, ?, ?, ?)',
      [companyId, skill_required, stipend || 0, location || '', duration || '', description || '']
    );

    res.status(201).json({ message: 'Internship posted!', internshipId: result.insertId });
  } catch (err) {
    console.error('Create internship error:', err);
    res.status(500).json({ error: 'Failed to post internship.' });
  }
}

// PUT /api/internships/:id — Update internship
async function updateInternship(req, res) {
  try {
    const { id } = req.params;
    const { skill_required, stipend, location, duration, description, status } = req.body;

    await pool.query(
      'UPDATE internships SET skill_required=?, stipend=?, location=?, duration=?, description=?, status=? WHERE id=?',
      [skill_required, stipend, location, duration, description, status || 'Active', id]
    );

    res.json({ message: 'Internship updated!' });
  } catch (err) {
    console.error('Update internship error:', err);
    res.status(500).json({ error: 'Failed to update internship.' });
  }
}

// DELETE /api/internships/:id — Delete internship
async function deleteInternship(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM internships WHERE id = ?', [id]);
    res.json({ message: 'Internship deleted!' });
  } catch (err) {
    console.error('Delete internship error:', err);
    res.status(500).json({ error: 'Failed to delete internship.' });
  }
}

module.exports = { getInternships, createInternship, updateInternship, deleteInternship };
