// ============================================
// INTERNMATCH — DATABASE CONFIG
// MySQL Connection Pool
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'internmatch',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully');
    conn.release();
    module.exports = pool;
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    console.log('🔄 Switching to in-memory database fallback...');
    module.exports = require('./db-fallback');
  });

// Export pool initially (will be replaced by fallback if connection fails)
module.exports = pool;
