# File Deletion Troubleshooting Guide

## Issue: Documents deleted from database but files remain in folder

---

## Step 1: Check Server Logs

When you permanently delete a document, you should see these logs in your terminal:

```
🗑️ Permanent delete requested for document ID: doc-123
📄 Document details: { id: 'doc-123', filename: 'example.pdf', url: '/uploads/...' }
Attempting to delete file with URL: /uploads/user-123/passport/2024/12/example.pdf
Full file path: D:\GitHub\FileSafe\studio\public\uploads\user-123\passport\2024\12\example.pdf
File exists, proceeding with deletion
✅ Successfully deleted physical file: D:\GitHub\FileSafe\studio\public\uploads\...
🗄️ Deleting from database...
✅ Document permanently deleted from database
```

---

## Step 2: Check What You See

### ❌ If you see: "No URL found for document"
**Problem:** The `url` field in database is NULL or empty

**Solution:**
```sql
-- Check documents table
SELECT id, filename, url FROM documents WHERE id = 'your-doc-id';

-- If url is NULL, the document was uploaded incorrectly
-- You'll need to manually delete the file
```

### ❌ If you see: "File does not exist"
**Problem:** The file path is wrong or file was already deleted

**Check:**
1. Verify the path shown in logs
2. Check if file actually exists at that location
3. Check file permissions

### ❌ If you see: "Error deleting physical file: EPERM"
**Problem:** Permission denied

**Solution (Windows):**
```powershell
# Give full permissions to uploads folder
icacls "public\uploads" /grant Users:F /T
```

### ❌ If you see: "Error deleting physical file: ENOENT"
**Problem:** File or directory doesn't exist

**Possible causes:**
1. File was already deleted manually
2. Path is incorrect
3. URL in database is wrong

---

## Step 3: Manual Verification

### Check Database URL Format

```sql
-- See what URLs look like in your database
SELECT id, filename, url FROM documents LIMIT 5;
```

**Expected format:**
```
/uploads/user-123/passport/2024/12/document.pdf
```

**NOT:**
```
uploads/user-123/passport/2024/12/document.pdf  (missing leading /)
C:\path\to\file.pdf  (absolute path - wrong!)
```

### Check Actual File Location

```powershell
# Navigate to your project
cd D:\GitHub\FileSafe\studio

# List files in uploads
Get-ChildItem -Path "public\uploads" -Recurse -File | Select-Object FullName
```

---

## Step 4: Test File Deletion

### Test 1: Upload a new document
1. Upload a test document
2. Note the file path in `public/uploads/`
3. Check database for the URL:
   ```sql
   SELECT id, filename, url FROM documents ORDER BY upload_date DESC LIMIT 1;
   ```

### Test 2: Soft delete
1. Delete the document (should go to trash)
2. Verify file still exists in folder
3. Check database:
   ```sql
   SELECT id, filename, url, is_deleted, deleted_at FROM documents WHERE id = 'your-id';
   ```

### Test 3: Permanent delete
1. Permanently delete from trash
2. **Watch the server logs carefully**
3. Check if file is gone:
   ```powershell
   Test-Path "public\uploads\user-id\...\filename.pdf"
   # Should return False
   ```
4. Check database:
   ```sql
   SELECT * FROM documents WHERE id = 'your-id';
   # Should return empty
   ```

---

## Step 5: Common Issues & Fixes

### Issue 1: URL field is NULL

**Check upload API:**
```typescript
// In upload handler, make sure URL is saved:
await pool.execute(
  'INSERT INTO documents (id, employee_id, filename, url, ...) VALUES (?, ?, ?, ?, ...)',
  [id, userId, filename, fileUrl, ...]  // Make sure fileUrl is included!
);
```

### Issue 2: Wrong path separator

**Windows uses backslash `\`, but URLs use forward slash `/`**

The code should handle this, but verify:
```typescript
// URL should be: /uploads/user/type/year/month/file.pdf
// NOT: \uploads\user\type\year\month\file.pdf
```

### Issue 3: File locked by another process

**Windows might lock files that are open**

**Solution:**
1. Close any programs viewing the file
2. Restart the dev server
3. Try delete again

### Issue 4: Permissions

**Node.js might not have permission to delete**

**Solution (Run as Administrator):**
```powershell
# Stop dev server
# Open PowerShell as Administrator
cd D:\GitHub\FileSafe\studio
npm run dev
```

---

## Step 6: Debug Script

Create a test file to debug: `test-delete.js`

```javascript
const { join } = require('path');
const { unlink, access, constants } = require('fs/promises');

async function testDelete() {
  // Replace with actual URL from your database
  const url = '/uploads/user-123/passport/2024/12/test.pdf';
  
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  const filePath = join(process.cwd(), 'public', cleanUrl);
  
  console.log('Testing file deletion:');
  console.log('URL:', url);
  console.log('Clean URL:', cleanUrl);
  console.log('Full path:', filePath);
  
  try {
    await access(filePath, constants.F_OK);
    console.log('✅ File exists');
    
    await unlink(filePath);
    console.log('✅ File deleted successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
  }
}

testDelete();
```

**Run it:**
```bash
node test-delete.js
```

---

## Step 7: Force Delete All Files for a User

If you need to manually clean up:

```powershell
# Delete all files for a specific user
Remove-Item -Path "public\uploads\user-123" -Recurse -Force

# Or delete all uploads (CAREFUL!)
Remove-Item -Path "public\uploads\*" -Recurse -Force
```

---

## Step 8: Check Upload API

The issue might be in how files are uploaded. Check your upload endpoint:

```typescript
// Make sure the URL is being saved correctly
const fileUrl = `/uploads/${userId}/${docType}/${year}/${month}/${filename}`;

await pool.execute(
  'INSERT INTO documents (..., url) VALUES (..., ?)',
  [..., fileUrl]  // ← Make sure this is included!
);
```

---

## Expected Behavior

### When you SOFT DELETE:
- ✅ Database: `is_deleted = 1`, `deleted_at = NOW()`
- ✅ File: **Remains in folder**
- ✅ UI: Document appears in "Deleted Items"

### When you PERMANENT DELETE:
- ✅ Database: Record completely removed
- ✅ File: **Deleted from folder**
- ✅ UI: Document disappears from "Deleted Items"

---

## Quick Checklist

After permanent delete, verify:

- [ ] Server logs show "✅ Successfully deleted physical file"
- [ ] Database record is gone: `SELECT * FROM documents WHERE id = '...'`
- [ ] File is gone from disk: Check `public/uploads/...`
- [ ] No error messages in console

---

## Still Not Working?

### Collect Debug Info:

1. **Document ID:** `_____________`
2. **URL from database:** `_____________`
3. **Full file path:** `_____________`
4. **File exists?** Yes / No
5. **Error message:** `_____________`
6. **Server logs:** (paste here)

### Then check:
1. Is the URL format correct? (starts with `/uploads/`)
2. Does the file actually exist at that path?
3. Do you have permission to delete it?
4. Is the file open in another program?

---

## Contact Support

If still stuck, provide:
1. Server logs from permanent delete
2. Database URL for the document
3. Screenshot of file location
4. Any error messages
