-- Add new columns to announcements table

ALTER TABLE announcements 
ADD COLUMN priority ENUM('low', 'medium', 'high') DEFAULT 'medium' AFTER message;

ALTER TABLE announcements 
ADD COLUMN expires_on DATE DEFAULT NULL AFTER priority;

ALTER TABLE announcements 
ADD COLUMN target_departments TEXT DEFAULT NULL AFTER expires_on;

-- Verify the structure
DESCRIBE announcements;
