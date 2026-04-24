const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306,
      ssl: process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud') ? { rejectUnauthorized: false } : undefined,
      multipleStatements: true
    });
    
    const sql = fs.readFileSync('schema.sql', 'utf8');
    await connection.query(sql);
    console.log('✅ Schema applied successfully!');
    await connection.end();
  } catch (err) {
    console.error('❌ Error applying schema:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Tip: Check your MySQL credentials in .env file');
    }
  }
}

run();
