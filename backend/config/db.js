// ============================================
// INTERNMATCH — DATABASE CONFIG (MySQL Only)
// Production-ready MySQL connection pool
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();
const { resolveMysqlConfig, describeMysqlConfig } = require('./db-config');

const dbConfig = resolveMysqlConfig({ includeDatabase: true });

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    console.log('🔎 Resolved MySQL config:', describeMysqlConfig(dbConfig));
    console.log('💡 Tip: Check the DB host/port/user/password in your Render environment variables.');
    console.log('💡 If you are using Aiven, verify the hostname exactly matches the public endpoint from Aiven.');
    process.exit(1);
  });

module.exports = pool;
