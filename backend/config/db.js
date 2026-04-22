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

let currentDb = pool;

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    console.log('🔄 Switching to in-memory database fallback...');
    currentDb = require('./db-fallback');
  });

// Export a wrapper that dynamically uses currentDb
module.exports = {
  query: (...args) => currentDb.query(...args),
  getConnection: (...args) => {
    if (currentDb.getConnection) {
      return currentDb.getConnection(...args);
    }
    // Fallback stub for getConnection
    return Promise.resolve({
      release: () => {},
      query: (...qArgs) => currentDb.query(...qArgs)
    });
  }
};
