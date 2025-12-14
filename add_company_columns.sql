-- Add missing columns to companies table if they don't exist

-- Add location column
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT NULL;

-- Add logo column (for storing base64 images)
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS logo TEXT DEFAULT NULL;

-- Verify the structure
DESCRIBE companies;
