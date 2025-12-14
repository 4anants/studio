-- Run this SQL to add the location column to companies table

ALTER TABLE companies 
ADD COLUMN location VARCHAR(255) DEFAULT NULL AFTER email;

-- Verify it was added
DESCRIBE companies;
