-- Create Database
DROP DATABASE IF EXISTS internmatch;
CREATE DATABASE internmatch;
USE internmatch;

-- 1. Students Table
-- Stores student profiles and academic details.
CREATE TABLE Students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    department VARCHAR(50),
    year_of_study INT
) ENGINE=InnoDB;

-- 2. Skills Table
-- A catalogue of available technical skills and proficiencies.
CREATE TABLE Skills (
    skill_id INT PRIMARY KEY AUTO_INCREMENT,
    skill_name VARCHAR(100) NOT NULL,
    skill_level VARCHAR(50)
) ENGINE=InnoDB;

-- 3. Student_Skills Table (Junction Table)
-- Maps students to their respective skills (Many-to-Many).
CREATE TABLE Student_Skills (
    student_id INT,
    skill_id INT,
    PRIMARY KEY (student_id, skill_id),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES Skills(skill_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Companies Table
-- Stores information about companies offering internships.
CREATE TABLE Companies (
    company_id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    location VARCHAR(100),
    industry VARCHAR(100)
) ENGINE=InnoDB;

-- 5. Internships Table
-- Details the internships posted by companies.
CREATE TABLE Internships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT,
    skill_required VARCHAR(100),
    duration VARCHAR(50),
    stipend INT,
    location VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES Companies(company_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Applications Table
-- Tracks student applications for specific internships.
CREATE TABLE Applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    internship_id INT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pending',
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------
-- Insert Sample Data (BONUS)
-- --------------------------------------------------

-- Insert 2 Students
INSERT INTO Students (name, email, password, phone, department, year_of_study) VALUES 
('Alice Smith', 'alice.smith@example.com', '$2a$10$qrkD6vAg9RBMjI/WwbcUMeEE9/dJnezlJ8Vy9hdyqc2MkutUc5n7W', '1234567890', 'Computer Science', 3),
('Bob Jones', 'bob.jones@example.com', '$2a$10$qrkD6vAg9RBMjI/WwbcUMeEE9/dJnezlJ8Vy9hdyqc2MkutUc5n7W', '0987654321', 'Information Technology', 2);

-- Insert 3 Skills
INSERT INTO Skills (skill_name, skill_level) VALUES 
('JavaScript', 'Intermediate'),
('Python', 'Advanced'),
('SQL', 'Beginner');

-- Insert Student Skills (Mapping)
INSERT INTO Student_Skills (student_id, skill_id) VALUES 
(1, 1), -- Alice knows JavaScript
(1, 2), -- Alice knows Python
(2, 3); -- Bob knows SQL

-- Insert 2 Companies
INSERT INTO Companies (company_name, email, password, location, industry) VALUES 
('TechCorp', 'hr@techcorp.com', '$2a$10$qrkD6vAg9RBMjI/WwbcUMeEE9/dJnezlJ8Vy9hdyqc2MkutUc5n7W', 'San Francisco', 'Software'),
('DataWorks', 'contact@dataworks.com', '$2a$10$qrkD6vAg9RBMjI/WwbcUMeEE9/dJnezlJ8Vy9hdyqc2MkutUc5n7W', 'New York', 'Data Analytics');

-- Insert 3 Internships
INSERT INTO Internships (company_id, skill_required, duration, stipend, location, description) VALUES 
(1, 'JavaScript', '3 Months', 5000, 'Remote', 'Frontend dev internship'),
(1, 'Python', '6 Months', 8000, 'On-site', 'Backend dev internship'),
(2, 'SQL', '2 Months', 4000, 'Hybrid', 'Data analysis internship');

-- Insert 2 Applications
INSERT INTO Applications (student_id, internship_id, status) VALUES 
(1, 1, 'Pending'),
(2, 3, 'Selected');
