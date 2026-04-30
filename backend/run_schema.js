const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();
const path = require('path');
const { resolveMysqlConfig, describeMysqlConfig } = require('./config/db-config');

async function run() {
  try {
    const connectionConfig = resolveMysqlConfig({ includeDatabase: false });
    const connection = await mysql.createConnection({
      ...connectionConfig,
      multipleStatements: true,
      connectTimeout: 10000
    });

    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await connection.query(sql);
    console.log('✅ Schema applied successfully!');
    await connection.end();
  } catch (err) {
    console.error('❌ Error applying schema:', err.message);
    console.log('🔎 Resolved MySQL config:', describeMysqlConfig(resolveMysqlConfig({ includeDatabase: false })));
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Tip: Check your MySQL credentials in .env file');
    } else if (err.code === 'ENOTFOUND') {
      console.log('💡 Tip: The database hostname could not be resolved. Double-check the exact Render/Aiven host value.');
    }
  }
}

run();
