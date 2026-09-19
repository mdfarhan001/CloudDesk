-- CloudDesk Database Initialization
-- This file runs automatically the first time the MySQL container starts.

CREATE DATABASE IF NOT EXISTS clouddesk_db;
USE clouddesk_db;

-- ========== USERS ==========
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Developer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== PROJECTS ==========
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'Pending',
    progress INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========== TASKS ==========
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_id INT,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'Pending',
    priority VARCHAR(20) DEFAULT 'Medium',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- ========== NOTES ==========
CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========== FILES ==========
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    file_name VARCHAR(200) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========== TEAM ACTIVITY ==========
CREATE TABLE IF NOT EXISTS team_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========== SEED DATA ==========
-- Sample user: email = demo@clouddesk.com | password = password123
-- Password is stored as a Werkzeug hash, NEVER as plain text.
INSERT INTO users (name, email, password_hash, role)
VALUES (
    'MD Farhan',
    'demo@clouddesk.com',
    'scrypt:32768:8:1$4GKMunL0HiQLzJPm$c12e630ebb67a53020d57ab08e84c119a5dae771b3e098725e6feb150397c5a1f18140e1847e4668a8eb421a63aa39daed75dd58f9d81c24e2a50b4dd4b53457',
    'Developer'
);

INSERT INTO projects (user_id, project_name, description, status, progress) VALUES
(1, 'CloudDesk Website', 'Main 3-tier productivity app', 'In Progress', 60),
(1, 'AWS Cloud Project', 'Learning AWS EC2 deployment', 'Pending', 10),
(1, 'Docker Application', 'Practice containerization', 'Completed', 100);

INSERT INTO tasks (user_id, project_id, title, description, status, priority, due_date) VALUES
(1, 1, 'Design login page', 'Create login/register UI', 'Completed', 'High', '2026-09-01'),
(1, 1, 'Build Flask API', 'REST endpoints for auth and CRUD', 'In Progress', 'High', '2026-09-25'),
(1, 2, 'Launch EC2 instance', 'Set up Ubuntu server on AWS', 'Pending', 'Medium', '2026-10-05');

INSERT INTO notes (user_id, title, content) VALUES
(1, 'Docker Notes', 'Remember: containers should never expose MySQL publicly.'),
(1, 'JWT Notes', 'JWT token expires in 24 hours, refresh logic can be added later.');

INSERT INTO team_activity (user_id, activity) VALUES
(1, 'MD Farhan created a new project.'),
(1, 'MD Farhan completed a task.');
