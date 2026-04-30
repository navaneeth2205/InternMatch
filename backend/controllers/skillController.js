// ============================================
// SKILL CONTROLLER
// Persist student-selected skills in MySQL
// ============================================

const pool = require('../config/db');

async function getMySkills(req, res) {
  try {
    const studentId = req.user.id;

    const [rows] = await pool.query(
      `SELECT s.skill_name
       FROM Student_Skills ss
       JOIN Skills s ON ss.skill_id = s.skill_id
       WHERE ss.student_id = ?
       ORDER BY s.skill_name ASC`,
      [studentId]
    );

    res.json(rows.map(row => row.skill_name));
  } catch (err) {
    console.error('Get skills error:', err);
    res.status(500).json({ error: 'Failed to fetch skills.' });
  }
}

async function addSkill(req, res) {
  try {
    const studentId = req.user.id;
    const { skill } = req.body;

    if (!skill || !skill.trim()) {
      return res.status(400).json({ error: 'Skill is required.' });
    }

    const skillName = skill.trim();

    await pool.query(
      'INSERT IGNORE INTO Skills (skill_name) VALUES (?)',
      [skillName]
    );

    const [skillRows] = await pool.query(
      'SELECT skill_id FROM Skills WHERE skill_name = ?',
      [skillName]
    );

    if (skillRows.length === 0) {
      return res.status(500).json({ error: 'Skill could not be saved.' });
    }

    const skillId = skillRows[0].skill_id;

    await pool.query(
      'INSERT IGNORE INTO Student_Skills (student_id, skill_id) VALUES (?, ?)',
      [studentId, skillId]
    );

    res.status(201).json({ message: 'Skill saved successfully.', skill: skillName });
  } catch (err) {
    console.error('Add skill error:', err);
    res.status(500).json({ error: 'Failed to save skill.' });
  }
}

async function removeSkill(req, res) {
  try {
    const studentId = req.user.id;
    const { skillName } = req.params;

    await pool.query(
      `DELETE ss
       FROM Student_Skills ss
       JOIN Skills s ON ss.skill_id = s.skill_id
       WHERE ss.student_id = ? AND s.skill_name = ?`,
      [studentId, skillName]
    );

    res.json({ message: 'Skill removed successfully.' });
  } catch (err) {
    console.error('Remove skill error:', err);
    res.status(500).json({ error: 'Failed to remove skill.' });
  }
}

module.exports = { getMySkills, addSkill, removeSkill };
