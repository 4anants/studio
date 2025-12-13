DROP TABLE IF EXISTS announcement_reads;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS holidays;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS companies;

-- Users Table (Extended)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    personal_email VARCHAR(255),
    password_hash VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    
    -- Profile Fields
    avatar VARCHAR(255),
    mobile VARCHAR(20),
    emergency_contact VARCHAR(20),
    date_of_birth DATE,
    joining_date DATE,
    resignation_date DATE,
    designation VARCHAR(100),
    department VARCHAR(100),
    blood_group VARCHAR(10),
    company_id VARCHAR(50), -- Link to companies table
    location VARCHAR(50), -- e.g., 'AMD', 'HYD'
    status ENUM('active', 'inactive', 'pending', 'deleted') DEFAULT 'active',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo TEXT
);

-- Documents Table (Updated)
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_type VARCHAR(50), -- pdf, doc, image
    category VARCHAR(100), -- Salary Slip, Personal, etc.
    url TEXT,
    size VARCHAR(50),
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Holidays Table
CREATE TABLE IF NOT EXISTS holidays (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(50) DEFAULT 'ALL' -- 'ALL', 'AMD', 'HYD', 'US'
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    author VARCHAR(100),
    status ENUM('published', 'deleted') DEFAULT 'published',
    event_date DATE
);

-- Announcement Reads (Track which user read which announcement)
CREATE TABLE IF NOT EXISTS announcement_reads (
    user_id VARCHAR(50) NOT NULL,
    announcement_id VARCHAR(50) NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, announcement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
);
