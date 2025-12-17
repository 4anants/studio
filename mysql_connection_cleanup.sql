-- MySQL Connection Cleanup Script
-- Run this if you're still getting "Too many connections" after restart

-- 1. Check current connections
SHOW PROCESSLIST;

-- 2. Check max connections setting
SHOW VARIABLES LIKE 'max_connections';

-- 3. Kill all connections from your app (if needed)
-- Replace 'your_db_user' with your actual database user
SELECT CONCAT('KILL ', id, ';') 
FROM INFORMATION_SCHEMA.PROCESSLIST 
WHERE USER = 'your_db_user' 
AND COMMAND = 'Sleep';

-- 4. Increase max_connections if needed (requires SUPER privilege)
SET GLOBAL max_connections = 200;

-- 5. Verify the change
SHOW VARIABLES LIKE 'max_connections';
