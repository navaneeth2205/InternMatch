// ============================================
// APPLICATION CONTROLLER
// Student apply + Company manage
// ============================================

const pool = require('../config/db');

// POST /api/apply — Student applies to internship
async function applyToInternship(req, res) {
  try {
    const userId = req.user.id;
    const { internship_id } = req.body;

    if (!internship_id) {
      return res.status(400).json({ error: 'Internship ID is required.' });
    }

    const studentId = userId;

    // Check if already applied
    const [existing] = await pool.query(
      'SELECT id FROM applications WHERE student_id = ? AND internship_id = ?',
      [studentId, internship_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Already applied to this internship.' });
    }

    // Insert application
    const [result] = await pool.query(
      'INSERT INTO applications (student_id, internship_id) VALUES (?, ?)',
      [studentId, internship_id]
    );

    res.status(201).json({ message: 'Applied successfully!', applicationId: result.insertId });
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ error: 'Failed to apply.' });
  }
}

// GET /api/applications — Company views applications
async function getApplications(req, res) {
  try {
    const userId = req.user.id;

    const companyId = userId;

    const [rows] = await pool.query(`
      SELECT a.id, a.status, a.applied_at,
             CONCAT(u.first_name, ' ', u.last_name) AS student_name, u.email AS student_email,
             i.skill_required, i.stipend, i.location AS internship_location
      FROM applications a
      JOIN Students u ON a.student_id = u.student_id
      JOIN internships i ON a.internship_id = i.id
      WHERE i.company_id = ?
      ORDER BY a.applied_at DESC
    `, [companyId]);

    res.json(rows);
  } catch (err) {
    console.error('Get applications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
}

// PUT /api/applications/:id — Update application status (Accept/Reject)
async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Selected', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    await pool.query('UPDATE applications SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: `Application ${status.toLowerCase()}!` });
  } catch (err) {
    console.error('Update application error:', err);
    res.status(500).json({ error: 'Failed to update application.' });
  }
}

// GET /api/my-applications — Student views own applications
async function getMyApplications(req, res) {
  try {
    const userId = req.user.id;

    const studentId = userId;

    const [rows] = await pool.query(`
      SELECT a.id, a.internship_id, a.status, a.applied_at,
             i.skill_required, i.stipend, i.location, i.duration,
             c.company_name
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      JOIN companies c ON i.company_id = c.company_id
      WHERE a.student_id = ?
      ORDER BY a.applied_at DESC
    `, [studentId]);

    res.json(rows);
  } catch (err) {
    console.error('Get my applications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
}

// DELETE /api/applications/withdraw/:id — Student withdraws their own application
async function withdrawApplication(req, res) {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    // Delete application ONLY if it belongs to the logged-in student
    const [result] = await pool.query(
      'DELETE FROM applications WHERE id = ? AND student_id = ?',
      [id, studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Application not found or you do not have permission to withdraw it.' });
    }

    res.json({ message: 'Application withdrawn successfully.' });
  } catch (err) {
    console.error('Withdraw application error:', err);
    res.status(500).json({ error: 'Failed to withdraw application.' });
  }
}

module.exports = { applyToInternship, getApplications, updateApplicationStatus, getMyApplications, withdrawApplication };
