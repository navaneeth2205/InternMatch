// ============================================
// INTERNMATCH — DATABASE CONFIG
// Priority: MySQL (production) → SQLite (local dev, persistent)
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Check if valid MySQL credentials are set in .env
const hasMySQLConfig = process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD !== undefined;

let currentDb = null;

if (hasMySQLConfig) {
  // Try MySQL
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'internmatch',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Set as current immediately (optimistic)
  currentDb = {
    query: (...args) => pool.query(...args),
    getConnection: (...args) => pool.getConnection(...args)
  };

  pool.getConnection()
    .then(conn => {
      console.log('✅ MySQL connected successfully');
      conn.release();
    })
    .catch(err => {
      console.error('❌ MySQL connection failed:', err.message);
      console.log('🔄 Switching to SQLite persistent database...');
      const sqlite = require('./db-sqlite');
      currentDb.query = sqlite.query;
      currentDb.getConnection = sqlite.getConnection;
    });
} else {
  // No MySQL config — skip straight to SQLite
  console.log('ℹ️  No MySQL config found. Using SQLite persistent database.');
  const sqlite = require('./db-sqlite');
  currentDb = sqlite;
}

module.exports = {
  query: (...args) => currentDb.query(...args),
  getConnection: (...args) => {
    if (currentDb.getConnection) return currentDb.getConnection(...args);
    return Promise.resolve({ release: () => {}, query: (...a) => currentDb.query(...a) });
  }
};
