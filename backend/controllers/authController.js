// ============================================
// AUTH CONTROLLER
// Register + Login
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// POST /api/register
async function register(req, res) {
  try {
    const { name, email, password, role, companyName } = req.body;

    // Validate
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!['student', 'company'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be student or company.' });
    }

    const table = role === 'student' ? 'Students' : 'Companies';
    
    // Check if user exists
    const [existing] = await pool.query(`SELECT * FROM ${table} WHERE email = ?`, [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let userId;
    // Insert user
    if (role === 'student') {
       const [result] = await pool.query(
         'INSERT INTO Students (name, email, password) VALUES (?, ?, ?)',
         [name, email, hashedPassword]
       );
       userId = result.insertId;
    } else {
       const [result] = await pool.query(
         'INSERT INTO Companies (company_name, email, password) VALUES (?, ?, ?)',
         [companyName || name, email, hashedPassword]
       );
       userId = result.insertId;
    }

    res.status(201).json({ message: 'Registration successful!', userId });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
}

// POST /api/login
async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required.' });
    }

    const table = role === 'student' ? 'Students' : 'Companies';

    // Find user
    const [users] = await pool.query(`SELECT * FROM ${table} WHERE email = ?`, [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Standardize user object for JWT
    const jwtUser = {
      id: role === 'student' ? user.student_id : user.company_id,
      name: role === 'student' ? user.name : user.company_name,
      email: user.email,
      role: role
    };

    // Generate JWT
    const token = jwt.sign(
      jwtUser,
      process.env.JWT_SECRET || 'secret123', // Fallback secret
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: jwtUser
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
}

module.exports = { register, login };
