-- Add PIN columns to users table

-- Add document_pin column (hashed 4-digit PIN)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS document_pin VARCHAR(255) NULL;

-- Add pin_set flag to track if user has set their PIN
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS pin_set BOOLEAN DEFAULT 0;

-- Add failed_pin_attempts for security
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS failed_pin_attempts INT DEFAULT 0;

-- Add pin_locked_until for temporary lockout after too many failed attempts
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMP NULL DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_pin ON users(pin_set, pin_locked_until);
