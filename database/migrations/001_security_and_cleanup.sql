-- FileSafe Database Schema Updates
-- Date: 2025-12-14
-- Purpose: Security and cleanup features

-- ============================================
-- 1. DOCUMENTS TABLE - Add soft delete columns
-- ============================================

-- Add is_deleted column if not exists
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT 0;

-- Add deleted_at timestamp column if not exists
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_deleted ON documents(is_deleted, deleted_at);

-- ============================================
-- 2. USERS TABLE - Add display_name column
-- ============================================

-- Add display_name column if not exists (already handled by auto-repair in code)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255) AFTER last_name;

-- ============================================
-- 3. VERIFY EXISTING TABLES
-- ============================================

-- Verify all required tables exist
-- (These should already exist from initial setup)

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    display_name VARCHAR(255),
    personal_email VARCHAR(255),
    mobile VARCHAR(20),
    emergency_contact VARCHAR(20),
    date_of_birth DATE,
    blood_group VARCHAR(10),
    department VARCHAR(255),
    designation VARCHAR(255),
    location VARCHAR(255),
    company_id VARCHAR(255),
    joining_date DATE,
    resignation_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    is_admin BOOLEAN DEFAULT 0,
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(255) PRIMARY KEY,
    employee_id VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_type VARCHAR(50),
    category VARCHAR(255),
    url TEXT,
    size VARCHAR(50),
    is_deleted BOOLEAN DEFAULT 0,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    short_name VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    location VARCHAR(255),
    logo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Types table
CREATE TABLE IF NOT EXISTS document_types (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Holidays table
CREATE TABLE IF NOT EXISTS holidays (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium',
    department VARCHAR(255),
    event_date DATE,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'published'
);

-- ============================================
-- 4. DATA CLEANUP QUERIES (Optional)
-- ============================================

-- Find documents older than 30 days in trash
-- (For manual verification before running cleanup)
SELECT id, filename, employee_id, deleted_at, 
       DATEDIFF(NOW(), deleted_at) as days_in_trash
FROM documents 
WHERE is_deleted = 1 
  AND deleted_at IS NOT NULL
  AND deleted_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Find users with deleted status
SELECT id, email, CONCAT(first_name, ' ', last_name) as name, status
FROM users 
WHERE status = 'deleted';

-- ============================================
-- 5. USEFUL QUERIES FOR VERIFICATION
-- ============================================

-- Check if columns exist
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'documents'
  AND COLUMN_NAME IN ('is_deleted', 'deleted_at');

SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'display_name';

-- Count active vs deleted documents
SELECT 
    CASE 
        WHEN is_deleted = 1 THEN 'Deleted'
        ELSE 'Active'
    END as status,
    COUNT(*) as count
FROM documents
GROUP BY is_deleted;

-- ============================================
-- 6. ROLLBACK QUERIES (If needed)
-- ============================================

-- Remove soft delete columns (USE WITH CAUTION!)
-- ALTER TABLE documents DROP COLUMN is_deleted;
-- ALTER TABLE documents DROP COLUMN deleted_at;
-- ALTER TABLE users DROP COLUMN display_name;

-- ============================================
-- NOTES:
-- ============================================
-- 1. The application has auto-repair logic that will add missing columns
-- 2. These SQL scripts are for manual database setup or verification
-- 3. Always backup database before running migrations
-- 4. Test in development environment first
-- 5. The application will work even if you don't run these manually
--    (auto-repair will handle it)
