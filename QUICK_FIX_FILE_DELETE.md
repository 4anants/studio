# Quick Fix Guide - File Not Deleting

## 🔍 STEP 1: Find Out Why (2 minutes)

### Open your browser and go to:
```
http://localhost:3000/api/debug-file?docId=YOUR_DOCUMENT_ID
```

**Replace `YOUR_DOCUMENT_ID` with the actual document ID**

### You'll see something like:
```json
{
  "document": {
    "id": "doc-123",
    "filename": "passport.pdf",
    "url": "/uploads/user-456/passport/2024/12/passport.pdf"
  },
  "filesystem": {
    "cleanUrl": "uploads/user-456/passport/2024/12/passport.pdf",
    "fullPath": "D:\\GitHub\\FileSafe\\studio\\public\\uploads\\user-456\\passport\\2024\\12\\passport.pdf",
    "fileExists": true,
    "fileError": null
  }
}
```

---

## 📋 STEP 2: Understand the Result

### ✅ If `fileExists: true`
**Good news!** The file exists and path is correct.

**Next:** Try permanent delete again and watch the server console for logs.

### ❌ If `fileExists: false` and you see an error
**Problem:** File doesn't exist or path is wrong.

**Possible reasons:**
1. File was already deleted manually
2. URL in database is incorrect
3. File was never uploaded properly

---

## 🔧 STEP 3: Try Permanent Delete Again

### Watch Your Server Console

When you click "Delete Permanently", you should see:

```
🗑️ Permanent delete requested for document ID: doc-123
📄 Document details: { id: 'doc-123', filename: 'passport.pdf', url: '/uploads/...' }
Attempting to delete file with URL: /uploads/user-456/passport/2024/12/passport.pdf
Full file path: D:\GitHub\FileSafe\studio\public\uploads\user-456\passport\2024\12\passport.pdf
File exists, proceeding with deletion
✅ Successfully deleted physical file: D:\GitHub\FileSafe\studio\public\uploads\...
🗄️ Deleting from database...
✅ Document permanently deleted from database
```

---

## 🐛 STEP 4: If Still Not Working

### Check the Error Message in Console

#### Error: "EPERM: operation not permitted"
**Fix:** Close any programs that might have the file open (PDF readers, etc.)

#### Error: "ENOENT: no such file or directory"
**Fix:** File doesn't exist. Check if it was already deleted or path is wrong.

#### Error: "File does not exist"
**Fix:** The URL in database doesn't match actual file location.

---

## 🧪 STEP 5: Manual Test (Advanced)

### Test file deletion directly:

```
POST http://localhost:3000/api/debug-file?docId=YOUR_DOC_ID&action=delete
```

**Using PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/debug-file?docId=YOUR_DOC_ID&action=delete" -Method POST
```

**Using curl:**
```bash
curl -X POST "http://localhost:3000/api/debug-file?docId=YOUR_DOC_ID&action=delete"
```

---

## ✅ STEP 6: Verify It Worked

### Check 1: Database
```sql
SELECT * FROM documents WHERE id = 'YOUR_DOC_ID';
```
Should return **empty** (no rows)

### Check 2: File System
Navigate to the file path shown in debug output and verify file is gone.

**PowerShell:**
```powershell
Test-Path "D:\GitHub\FileSafe\studio\public\uploads\user-456\passport\2024\12\passport.pdf"
```
Should return **False**

---

## 🎯 Common Solutions

### Solution 1: Restart Dev Server
Sometimes Node.js needs a fresh start:
```bash
# Press Ctrl+C to stop
npm run dev
```

### Solution 2: Check File Permissions
```powershell
# Run PowerShell as Administrator
icacls "public\uploads" /grant Users:F /T
```

### Solution 3: Close File Viewers
- Close Adobe Reader
- Close File Explorer
- Close any program viewing the file

### Solution 4: Manual Delete
If all else fails, delete manually:
```powershell
Remove-Item "public\uploads\user-456\passport\2024\12\passport.pdf" -Force
```

---

## 📊 What to Report

If still not working, collect this info:

1. **Document ID:** `_____________`
2. **Debug endpoint output:** (paste JSON)
3. **Server console logs:** (paste logs)
4. **Error message:** `_____________`
5. **File exists?** Yes / No

---

## 🚀 Expected Behavior

### Normal Flow:
1. Upload document → File saved to `public/uploads/...`
2. Soft delete → File stays, `is_deleted = 1` in DB
3. Permanent delete → File deleted from disk, record removed from DB

### After Permanent Delete:
- ✅ Database record: **GONE**
- ✅ Physical file: **GONE**
- ✅ Console shows: "✅ Successfully deleted physical file"

---

**Need more help? Check `FILE_DELETION_DEBUG.md` for detailed troubleshooting!**
