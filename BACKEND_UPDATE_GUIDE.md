# Backend Update Guide

## Overview
This guide explains the backend changes made for security and cleanup features.

---

## AUTOMATIC vs MANUAL UPDATES

### ✅ AUTOMATIC (No Action Required)
The application includes **auto-repair logic** that automatically adds missing database columns:

1. **documents.is_deleted** - Added automatically on first API call
2. **documents.deleted_at** - Added automatically on first API call  
3. **users.display_name** - Added automatically on first user save

**How it works:**
- When the API tries to use a column that doesn't exist
- It catches the error and runs `ALTER TABLE` to add the column
- Then retries the operation
- No manual intervention needed!

### 📋 MANUAL (Optional - For Clean Setup)
If you prefer to add columns manually or want to verify the database:

```bash
# Connect to your MySQL database
mysql -u root -p filesafe

# Run the migration script
source database/migrations/001_security_and_cleanup.sql
```

---

## DATABASE CHANGES

### 1. Documents Table - Soft Delete Support

**New Columns:**
```sql
is_deleted BOOLEAN DEFAULT 0
deleted_at TIMESTAMP NULL DEFAULT NULL
```

**Purpose:**
- Track deleted documents
- Enable 30-day auto-purge
- Allow restore functionality

**Auto-Repair Location:**
- `src/app/api/documents/route.ts` - `ensureIsDeletedColumn()`
- `src/app/api/documents/route.ts` - `ensureDeletedAtColumn()`

### 2. Users Table - Display Name

**New Column:**
```sql
display_name VARCHAR(255)
```

**Purpose:**
- Allow custom display names on ID cards
- Separate from first_name/last_name

**Auto-Repair Location:**
- `src/app/api/users/route.ts` - POST handler

---

## API CHANGES

### Authentication Added to ALL Endpoints

**Before:**
```typescript
export async function GET() {
  // No auth check
  const [rows] = await pool.query('SELECT * FROM users');
  return NextResponse.json(rows);
}
```

**After:**
```typescript
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  
  const [rows] = await pool.query('SELECT * FROM users');
  return NextResponse.json(rows);
}
```

**Affected Endpoints:**
- ✅ `/api/users` - Auth + role-based filtering
- ✅ `/api/companies` - Auth required
- ✅ `/api/departments` - Auth required
- ✅ `/api/holidays` - Auth required
- ✅ `/api/announcements` - Auth required
- ✅ `/api/document-types` - Auth required
- ✅ `/api/documents` - Auth already existed, verified

### New Helper Functions

**File:** `src/lib/auth-helpers.ts`

```typescript
// Check if user is authenticated
const auth = await requireAuth();

// Check if user is admin
const auth = await requireAdmin();

// Check if user owns resource or is admin
const auth = await requireOwnershipOrAdmin(resourceOwnerId);
```

---

## MIDDLEWARE PROTECTION

**File:** `src/middleware.ts`

**What it does:**
- Protects all `/dashboard/*` routes
- Requires authentication
- Validates admin access
- Redirects unauthorized users

**Configuration:**
```typescript
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*",
  ],
};
```

---

## NEW API ENDPOINTS

### 1. Cleanup Endpoint

**Endpoint:** `POST /api/cleanup?secret=YOUR_SECRET`

**Purpose:**
- Auto-purge documents deleted 30+ days ago
- Delete physical files
- Clean up user folders

**Usage:**
```bash
curl -X POST "http://localhost:3000/api/cleanup?secret=YOUR_SECRET"
```

**Response:**
```json
{
  "success": true,
  "documentsDeleted": 5,
  "userFoldersDeleted": 2,
  "message": "Cleanup completed: 5 documents and 2 user folders deleted"
}
```

---

## ENVIRONMENT VARIABLES

### Required for Production

Add to `.env.local`:

```env
# Authentication (Required)
NEXTAUTH_SECRET=your-strong-random-secret
NEXTAUTH_URL=http://localhost:3000

# Database (Required)
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your-password
DATABASE_NAME=filesafe

# Cleanup (Required for auto-purge)
CLEANUP_SECRET=your-cleanup-secret
```

### Generate Secrets

**PowerShell:**
```powershell
# Generate random secret
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Node.js:**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

---

## TESTING THE BACKEND

### 1. Test Authentication

```bash
# Should return 401 Unauthorized
curl http://localhost:3000/api/users

# Should work after login (with session cookie)
curl http://localhost:3000/api/users -H "Cookie: next-auth.session-token=..."
```

### 2. Test Soft Delete

```bash
# Soft delete a document
curl -X DELETE "http://localhost:3000/api/documents?id=doc-123"

# Verify it's marked as deleted in database
mysql> SELECT id, filename, is_deleted, deleted_at FROM documents WHERE id='doc-123';
```

### 3. Test Restore

```bash
# Restore a deleted document
curl -X PATCH "http://localhost:3000/api/documents?id=doc-123"

# Verify is_deleted is 0 and deleted_at is NULL
mysql> SELECT id, filename, is_deleted, deleted_at FROM documents WHERE id='doc-123';
```

### 4. Test Permanent Delete

```bash
# Permanently delete a document
curl -X DELETE "http://localhost:3000/api/documents?id=doc-123&permanent=true"

# Verify it's gone from database AND filesystem
mysql> SELECT * FROM documents WHERE id='doc-123';  # Should be empty
ls public/uploads/user-id/...  # File should be gone
```

### 5. Test Cleanup

```bash
# Manually set deleted_at to 31 days ago
mysql> UPDATE documents SET deleted_at = DATE_SUB(NOW(), INTERVAL 31 DAY) WHERE id='test-doc';

# Run cleanup
curl -X POST "http://localhost:3000/api/cleanup?secret=YOUR_SECRET"

# Verify document is permanently deleted
mysql> SELECT * FROM documents WHERE id='test-doc';  # Should be empty
```

---

## VERIFICATION QUERIES

### Check Database Schema

```sql
-- Verify documents table has new columns
DESCRIBE documents;

-- Should show:
-- is_deleted: tinyint(1), Default: 0
-- deleted_at: timestamp, Default: NULL

-- Verify users table has display_name
DESCRIBE users;

-- Should show:
-- display_name: varchar(255), Default: NULL
```

### Check Data

```sql
-- Count active vs deleted documents
SELECT 
    CASE WHEN is_deleted = 1 THEN 'Deleted' ELSE 'Active' END as status,
    COUNT(*) as count
FROM documents
GROUP BY is_deleted;

-- Find documents in trash
SELECT id, filename, deleted_at, 
       DATEDIFF(NOW(), deleted_at) as days_in_trash
FROM documents 
WHERE is_deleted = 1;

-- Find documents ready for auto-purge (30+ days)
SELECT id, filename, deleted_at
FROM documents 
WHERE is_deleted = 1 
  AND deleted_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

## TROUBLESHOOTING

### Issue: "Column 'is_deleted' doesn't exist"

**Solution:** The auto-repair should handle this, but if it doesn't:
```sql
ALTER TABLE documents ADD COLUMN is_deleted BOOLEAN DEFAULT 0;
ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
```

### Issue: "Unauthorized" on all API calls

**Solution:** Check NextAuth configuration:
1. Verify `NEXTAUTH_SECRET` is set
2. Check `NEXTAUTH_URL` matches your domain
3. Clear browser cookies and login again

### Issue: Cleanup endpoint returns 401

**Solution:** Check `CLEANUP_SECRET` environment variable:
```env
CLEANUP_SECRET=your-secret-here
```

### Issue: Physical files not deleting

**Solution:** Check file permissions:
```bash
# Windows
icacls "public\uploads" /grant Users:F /T

# Verify Node.js can delete files
node -e "require('fs').unlinkSync('test.txt')"
```

---

## ROLLBACK PLAN

If you need to revert changes:

### 1. Remove Database Columns
```sql
ALTER TABLE documents DROP COLUMN is_deleted;
ALTER TABLE documents DROP COLUMN deleted_at;
ALTER TABLE users DROP COLUMN display_name;
```

### 2. Revert Code Changes
```bash
git checkout HEAD~1 src/middleware.ts
git checkout HEAD~1 src/lib/auth-helpers.ts
git checkout HEAD~1 src/app/api/*/route.ts
```

### 3. Restore Environment
```bash
# Remove new environment variables
# Edit .env.local and remove:
# - CLEANUP_SECRET
```

---

## DEPLOYMENT CHECKLIST

### Before Deploying

- [ ] Backup database
- [ ] Test all security fixes locally
- [ ] Verify environment variables are set
- [ ] Test authentication flow
- [ ] Test role-based access
- [ ] Test document deletion/restore

### After Deploying

- [ ] Verify users can login
- [ ] Test admin access
- [ ] Check API authentication
- [ ] Monitor error logs
- [ ] Test cleanup endpoint
- [ ] Verify file deletion works

### Production Environment

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Set strong `CLEANUP_SECRET`
- [ ] Enable HTTPS
- [ ] Configure database backups
- [ ] Set up monitoring
- [ ] Configure log retention

---

## MONITORING

### What to Monitor

1. **Failed Login Attempts**
   - Check for brute force attacks
   - Alert on multiple failures

2. **Unauthorized Access Attempts**
   - Monitor 401/403 responses
   - Track IP addresses

3. **Cleanup Job Results**
   - Log documents deleted
   - Alert on failures

4. **Database Performance**
   - Monitor query times
   - Check index usage

### Recommended Tools

- **Application Logs:** Winston, Pino
- **Error Tracking:** Sentry
- **Uptime Monitoring:** UptimeRobot
- **Database Monitoring:** MySQL Workbench

---

## SUPPORT

### Documentation
- `SECURITY_AUDIT.md` - Detailed vulnerability report
- `SECURITY_FIXES.md` - Summary of fixes
- `CLEANUP_SETUP.md` - Auto-purge configuration
- `ENV_SETUP.md` - Environment variables

### Database Migrations
- `database/migrations/001_security_and_cleanup.sql`

### Need Help?
1. Check error logs in console
2. Verify environment variables
3. Test database connection
4. Review security documentation

---

**Last Updated:** 2025-12-14
**Version:** 1.0.0
