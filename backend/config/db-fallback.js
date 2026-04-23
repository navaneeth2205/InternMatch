// ============================================
// INTERNMATCH — DATABASE FALLBACK CONFIG
// In-memory storage for demo purposes (no MySQL required)
// ============================================

// In-memory storage
let students = [];
let companies = [];
let internships = [];
let applications = [];
let skills = [];
let studentSkills = [];
let nextIds = { student: 1, company: 1, internship: 1, application: 1, skill: 1 };

// Sample data
const sampleData = {
  students: [
    { student_id: 1, name: 'Alice Smith', email: 'alice@example.com', password: '$2a$10$qrkD6vAg9RBMjI/WwbcUMeEE9/dJnezlJ8Vy9hdyqc2MkutUc5n7W', phone: '1234567890', department: 'Computer Science', year_of_study: 3 },
    { student_id: 2, name: 'Bob Jones', email: 'bob@example.com', password: '$2a$10$qrkD6vAg9RBMjI/WwbcUMeEE9/dJnezlJ8Vy9hdyqc2MkutUc5n7W', phone: '0987654321', department: 'Information Technology', year_of_study: 2 }
  ],
  companies: [
    { company_id: 1, company_name: 'TechCorp', email: 'hr@techcorp.com', password: '$2a$10$qrkD6vAg9RBMjI/WwbcUMeEE9/dJnezlJ8Vy9hdyqc2MkutUc5n7W', location: 'San Francisco', industry: 'Software' },
    { company_id: 2, company_name: 'DataWorks', email: 'contact@dataworks.com', password: '$2a$10$qrkD6vAg9RBMjI/WwbcUMeEE9/dJnezlJ8Vy9hdyqc2MkutUc5n7W', location: 'New York', industry: 'Data Analytics' }
  ],
  skills: [
    { skill_id: 1, skill_name: 'JavaScript' },
    { skill_id: 2, skill_name: 'Python' },
    { skill_id: 3, skill_name: 'SQL' }
  ],
  studentSkills: [
    { student_id: 1, skill_id: 1, skill_level: 'Intermediate' },
    { student_id: 1, skill_id: 2, skill_level: 'Advanced' },
    { student_id: 2, skill_id: 3, skill_level: 'Beginner' }
  ],
  internships: [
    { id: 1, company_id: 1, skill_required: 'JavaScript', duration: '3 Months', stipend: 5000, location: 'Remote', description: 'Frontend dev internship', status: 'Active', created_at: new Date() },
    { id: 2, company_id: 1, skill_required: 'Python', duration: '6 Months', stipend: 8000, location: 'On-site', description: 'Backend dev internship', status: 'Active', created_at: new Date() },
    { id: 3, company_id: 2, skill_required: 'SQL', duration: '2 Months', stipend: 4000, location: 'Hybrid', description: 'Data analysis internship', status: 'Active', created_at: new Date() }
  ],
  applications: [
    { id: 1, student_id: 1, internship_id: 1, applied_at: new Date(), status: 'Pending' },
    { id: 2, student_id: 2, internship_id: 3, applied_at: new Date(), status: 'Selected' }
  ]
};

// Initialize with sample data
students = sampleData.students;
companies = sampleData.companies;
skills = sampleData.skills;
studentSkills = sampleData.studentSkills;
internships = sampleData.internships;
applications = sampleData.applications;
nextIds = { student: 3, company: 3, internship: 4, application: 3, skill: 4 };

// Mock pool object with query method
const mockPool = {
  query: async (sql, params = []) => {
    console.log('?? Fallback DB Query:', sql, params);
    console.log('?? SQL Lowercase:', sql.toLowerCase());
    
    // Parse SQL to determine operation
    const sqlLower = sql.toLowerCase();
    
    // SELECT queries — applications MUST be checked first because those queries
    // also contain 'students', 'internships', and 'email' which would match wrong branches
    if (sqlLower.includes('select')) {
      if (sqlLower.includes('applications')) {
        if (sqlLower.includes('join students') && sqlLower.includes('join internships')) {
          const companyId = Number(params[0]);
          const result = applications
            .filter(a => Number(internships.find(i => Number(i.id) === Number(a.internship_id))?.company_id) === companyId)
            .map(a => ({
              ...a,
              student_name: students.find(s => Number(s.student_id) === Number(a.student_id))?.name || 'Unknown',
              student_email: students.find(s => Number(s.student_id) === Number(a.student_id))?.email || 'Unknown',
              skill_required: internships.find(i => Number(i.id) === Number(a.internship_id))?.skill_required || 'Unknown',
              internship_location: internships.find(i => Number(i.id) === Number(a.internship_id))?.location || 'Unknown'
            }));
          return [result];
        }
        if (sqlLower.includes('join internships') && sqlLower.includes('join companies')) {
          const studentId = Number(params[0]);
          const result = applications
            .filter(a => Number(a.student_id) === studentId)
            .map(a => ({
              ...a,
              skill_required: internships.find(i => Number(i.id) === Number(a.internship_id))?.skill_required || 'Unknown',
              stipend: internships.find(i => Number(i.id) === Number(a.internship_id))?.stipend || 0,
              location: internships.find(i => Number(i.id) === Number(a.internship_id))?.location || 'Unknown',
              duration: internships.find(i => Number(i.id) === Number(a.internship_id))?.duration || 'Unknown',
              company_name: companies.find(c => Number(c.company_id) === Number(internships.find(i => Number(i.id) === Number(a.internship_id))?.company_id))?.company_name || 'Unknown'
            }));
          return [result];
        }
        // Duplicate-check: SELECT id FROM applications WHERE student_id = ? AND internship_id = ?
        if (sqlLower.includes('student_id') && sqlLower.includes('internship_id')) {
          const studentId = Number(params[0]);
          const internshipId = Number(params[1]);
          const found = applications.filter(a => Number(a.student_id) === studentId && Number(a.internship_id) === internshipId);
          return [found];
        }
        // SELECT * FROM applications WHERE student_id = ?
        if (sqlLower.includes('student_id') && params.length === 1) {
          return [applications.filter(a => Number(a.student_id) === Number(params[0]))];
        }
        return [applications];
      }
      if (sqlLower.includes('students') && sqlLower.includes('email')) {
        const email = params[0];
        return [students.filter(s => s.email === email)];
      }
      if (sqlLower.includes('companies') && sqlLower.includes('email')) {
        const email = params[0];
        return [companies.filter(c => c.email === email)];
      }
      if (sqlLower.includes('internships')) {
        if (sqlLower.includes('join companies')) {
          const result = internships
            .filter(i => i.status === 'Active')
            .map(i => ({
              ...i,
              company_name: companies.find(c => Number(c.company_id) === Number(i.company_id))?.company_name || 'Unknown'
            }));
          return [result];
        }
        return [internships];
      }
    }
    
    // INSERT queries
    if (sqlLower.includes('insert')) {
      if (sqlLower.includes('students')) {
        const newStudent = {
          student_id: nextIds.student++,
          name: params[0],
          email: params[1],
          password: params[2]
        };
        students.push(newStudent);
        return [{ insertId: newStudent.student_id }];
      }
      if (sqlLower.includes('companies')) {
        const newCompany = {
          company_id: nextIds.company++,
          company_name: params[0],
          email: params[1],
          password: params[2]
        };
        companies.push(newCompany);
        return [{ insertId: newCompany.company_id }];
      }
      if (sqlLower.includes('internships')) {
        const newInternship = {
          id: nextIds.internship++,
          company_id: params[0],
          skill_required: params[1],
          stipend: params[2],
          location: params[3],
          duration: params[4],
          description: params[5],
          status: 'Active',
          created_at: new Date()
        };
        internships.push(newInternship);
        return [{ insertId: newInternship.id }];
      }
      if (sqlLower.includes('applications')) {
        const newApplication = {
          id: nextIds.application++,
          student_id: params[0],
          internship_id: params[1],
          applied_at: new Date(),
          status: 'Pending'
        };
        applications.push(newApplication);
        return [{ insertId: newApplication.id }];
      }
    }
    
    // UPDATE queries
    if (sqlLower.includes('update')) {
      if (sqlLower.includes('internships')) {
        const id = params[params.length - 1];
        const internship = internships.find(i => i.id === id);
        if (internship) {
          Object.assign(internship, {
            skill_required: params[0],
            stipend: params[1],
            location: params[2],
            duration: params[3],
            description: params[4],
            status: params[5]
          });
        }
        return [{ affectedRows: 1 }];
      }
      if (sqlLower.includes('applications')) {
        const id = params[params.length - 1];
        const application = applications.find(a => a.id === id);
        if (application) {
          application.status = params[0];
        }
        return [{ affectedRows: 1 }];
      }
    }
    
    // DELETE queries
    if (sqlLower.includes('delete')) {
      if (sqlLower.includes('internships')) {
        const id = params[0];
        const index = internships.findIndex(i => i.id === id);
        if (index !== -1) {
          internships.splice(index, 1);
        }
        return [{ affectedRows: 1 }];
      }
    }
    
    return [[]];
  }
};

console.log('🔧 Using in-memory database fallback (no MySQL required)');
module.exports = mockPool;
