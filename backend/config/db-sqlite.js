// ============================================
// INTERNMATCH — SQLite PERSISTENT DATABASE
// File-based DB - survives server restarts!
// Data stored at: backend/internmatch.db
// ============================================

const Database = require('better-sqlite3');
const path = require('path');

// The DB file lives inside the backend folder
const DB_PATH = path.join(__dirname, '..', 'internmatch.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================
// CREATE TABLES (if not already there)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS Students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    phone      TEXT,
    department TEXT,
    year_of_study INTEGER
  );

  CREATE TABLE IF NOT EXISTS Skills (
    skill_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_name  TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Student_Skills (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id  INTEGER,
    skill_id    INTEGER,
    skill_level TEXT,
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id)   REFERENCES Skills(skill_id) ON DELETE CASCADE,
    UNIQUE(student_id, skill_id)
  );

  CREATE TABLE IF NOT EXISTS Companies (
    company_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    email        TEXT UNIQUE NOT NULL,
    password     TEXT NOT NULL,
    location     TEXT,
    industry     TEXT
  );

  CREATE TABLE IF NOT EXISTS Internships (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id   INTEGER NOT NULL,
    skill_required TEXT,
    duration     TEXT,
    stipend      INTEGER DEFAULT 0,
    location     TEXT,
    description  TEXT,
    status       TEXT DEFAULT 'Active',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES Companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_required) REFERENCES Skills(skill_name) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS Applications (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id   INTEGER NOT NULL,
    internship_id INTEGER NOT NULL,
    applied_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    status       TEXT DEFAULT 'Pending',
    FOREIGN KEY (student_id)    REFERENCES Students(student_id)   ON DELETE CASCADE,
    FOREIGN KEY (internship_id) REFERENCES Internships(id)        ON DELETE CASCADE
  );
`);

// ============================================
// SEED SAMPLE DATA (only if tables are empty)
// ============================================
const studentCount = db.prepare('SELECT COUNT(*) as c FROM Students').get().c;
if (studentCount === 0) {
  const samplePassword = '$2a$10$qrkD6vAg9RBMjI/WwbcUMeEE9/dJnezlJ8Vy9hdyqc2MkutUc5n7W'; // = "password123"

  db.prepare(`INSERT INTO Students (name, email, password, phone, department, year_of_study) VALUES (?,?,?,?,?,?)`)
    .run('Alice Smith', 'alice@example.com', samplePassword, '1234567890', 'Computer Science', 3);
  db.prepare(`INSERT INTO Students (name, email, password, phone, department, year_of_study) VALUES (?,?,?,?,?,?)`)
    .run('Bob Jones', 'bob@example.com', samplePassword, '0987654321', 'Information Technology', 2);

  db.prepare(`INSERT INTO Companies (company_name, email, password, location, industry) VALUES (?,?,?,?,?)`)
    .run('TechCorp', 'hr@techcorp.com', samplePassword, 'San Francisco', 'Software');
  db.prepare(`INSERT INTO Companies (company_name, email, password, location, industry) VALUES (?,?,?,?,?)`)
    .run('DataWorks', 'contact@dataworks.com', samplePassword, 'New York', 'Data Analytics');

  db.prepare(`INSERT INTO Skills (skill_name) VALUES (?)`).run('JavaScript');
  db.prepare(`INSERT INTO Skills (skill_name) VALUES (?)`).run('Python');
  db.prepare(`INSERT INTO Skills (skill_name) VALUES (?)`).run('SQL');

  db.prepare(`INSERT INTO Student_Skills (student_id, skill_id, skill_level) VALUES (?,?,?)`).run(1, 1, 'Intermediate');
  db.prepare(`INSERT INTO Student_Skills (student_id, skill_id, skill_level) VALUES (?,?,?)`).run(1, 2, 'Advanced');
  db.prepare(`INSERT INTO Student_Skills (student_id, skill_id, skill_level) VALUES (?,?,?)`).run(2, 3, 'Beginner');

  db.prepare(`INSERT INTO Internships (company_id, skill_required, duration, stipend, location, description) VALUES (?,?,?,?,?,?)`)
    .run(1, 'JavaScript', '3 Months', 5000, 'Remote', 'Frontend dev internship');
  db.prepare(`INSERT INTO Internships (company_id, skill_required, duration, stipend, location, description) VALUES (?,?,?,?,?,?)`)
    .run(1, 'Python', '6 Months', 8000, 'On-site', 'Backend dev internship');
  db.prepare(`INSERT INTO Internships (company_id, skill_required, duration, stipend, location, description) VALUES (?,?,?,?,?,?)`)
    .run(2, 'SQL', '2 Months', 4000, 'Hybrid', 'Data analysis internship');

  db.prepare(`INSERT INTO Applications (student_id, internship_id, status) VALUES (?,?,?)`)
    .run(1, 1, 'Pending');
  db.prepare(`INSERT INTO Applications (student_id, internship_id, status) VALUES (?,?,?)`)
    .run(2, 3, 'Selected');

  console.log('🌱 SQLite: Sample data seeded.');
}

// ============================================
// MYSQL2-COMPATIBLE POOL WRAPPER
// Returns [rows] for SELECT, [{insertId,affectedRows}] for writes
// ============================================
const sqlitePool = {
  query: (sql, params = []) => {
    try {
      const stmt = db.prepare(sql);
      const sqlLower = sql.trim().toLowerCase();

      if (sqlLower.startsWith('select')) {
        const rows = stmt.all(...params);
        return Promise.resolve([rows]);
      } else if (sqlLower.startsWith('insert')) {
        const result = stmt.run(...params);
        return Promise.resolve([{ insertId: result.lastInsertRowid, affectedRows: result.changes }]);
      } else {
        // UPDATE, DELETE
        const result = stmt.run(...params);
        return Promise.resolve([{ affectedRows: result.changes }]);
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },
  // Stub getConnection (not used but avoids errors if called)
  getConnection: () => Promise.resolve({ release: () => {}, query: sqlitePool.query })
};

console.log(`💾 SQLite database ready → ${DB_PATH}`);
module.exports = sqlitePool;
