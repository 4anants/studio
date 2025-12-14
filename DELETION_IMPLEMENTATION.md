# Document Deletion & Cleanup Implementation Summary

## Features Implemented

### 1. Physical File Deletion on Permanent Delete ✅
When a document is permanently deleted, the system now:
- Deletes the database record
- **Deletes the physical file** from `public/uploads/{userId}/{docType}/{year}/{month}/`
- Handles missing files gracefully (no errors if file already gone)

**Location**: `src/app/api/documents/route.ts`

### 2. User Folder Deletion ✅
When a user is deleted, the system now:
- Deletes all user's documents from database
- Deletes the user record
- **Deletes entire user folder**: `public/uploads/{userId}/`
- Removes all files and subdirectories recursively

**Location**: `src/app/api/users/route.ts`

### 3. Auto-Purge After 30 Days ✅
Deleted items are automatically purged after 30 days:
- New `deleted_at` timestamp column tracks when items were deleted
- Cleanup API endpoint checks for items older than 30 days
- Automatically deletes both database records and physical files
- Can be triggered manually or via cron job

**Location**: `src/app/api/cleanup/route.ts`

## Database Schema Changes

The system automatically adds these columns when needed:

```sql
ALTER TABLE documents ADD COLUMN is_deleted BOOLEAN DEFAULT 0;
ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
```

## How It Works

### Soft Delete (Normal Delete)
```
User clicks "Delete" → Document marked as deleted → deleted_at = NOW()
                                                   → is_deleted = 1
                                                   → File stays on disk
                                                   → Appears in "Deleted Items"
```

### Restore
```
Admin clicks "Restore" → is_deleted = 0
                      → deleted_at = NULL
                      → Document reappears in active list
```

### Permanent Delete
```
Admin clicks "Delete Permanently" → Database record deleted
                                  → Physical file deleted from disk
                                  → Cannot be recovered
```

### Auto-Purge (After 30 Days)
```
Cron job runs daily → Finds documents where deleted_at < 30 days ago
                   → Deletes physical files
                   → Deletes database records
                   → Logs results
```

## API Endpoints

### Documents API (`/api/documents`)
- **GET**: Fetch documents (active or deleted)
  - `?deleted=true` - Get deleted documents
- **DELETE**: Delete document
  - `?permanent=true` - Permanent delete (removes file)
  - Without param - Soft delete (marks as deleted)
- **PATCH**: Restore deleted document

### Cleanup API (`/api/cleanup`)
- **POST**: Run cleanup job
  - Requires `?secret=YOUR_SECRET` for security
  - Returns count of deleted items

### Users API (`/api/users`)
- **DELETE**: Delete user
  - Deletes all user's documents
  - Deletes user folder
  - Removes user record

## Setup Instructions

### 1. Environment Variables
Add to `.env.local`:
```env
CLEANUP_SECRET=your-secure-random-secret-here
```

See `ENV_SETUP.md` for details.

### 2. Configure Auto-Cleanup
Choose one option:

**Option A: Windows Task Scheduler** (Production)
- See `CLEANUP_SETUP.md` for detailed instructions

**Option B: Manual Trigger** (Testing)
```bash
curl -X POST "http://localhost:3000/api/cleanup?secret=YOUR_SECRET"
```

**Option C: Cron Service** (Production)
- Use Vercel Cron, GitHub Actions, or similar
- See `CLEANUP_SETUP.md` for examples

## Testing

### Test Physical File Deletion
1. Upload a document
2. Note the file path in `public/uploads/`
3. Permanently delete the document
4. Verify file is gone from filesystem

### Test User Folder Deletion
1. Create a test user with documents
2. Note the folder path `public/uploads/{userId}/`
3. Delete the user
4. Verify entire folder is gone

### Test Auto-Purge
1. Soft delete a document
2. Manually update database:
   ```sql
   UPDATE documents 
   SET deleted_at = DATE_SUB(NOW(), INTERVAL 31 DAY) 
   WHERE id = 'test-doc-id';
   ```
3. Call cleanup endpoint
4. Verify document and file are gone

## Security Considerations

- ✅ Cleanup endpoint requires secret key
- ✅ Only admins can permanently delete
- ✅ File deletion errors don't block database deletion
- ✅ User folder deletion is recursive and forced
- ⚠️ Consider adding IP whitelist for cleanup endpoint in production
- ⚠️ Keep CLEANUP_SECRET secure and rotate periodically

## Monitoring

Check logs for:
- `Deleted physical file: {path}` - File deletion success
- `Deleted user folder: {path}` - Folder deletion success
- `Error deleting physical file:` - File deletion issues
- `Cleanup completed: X documents and Y user folders deleted` - Summary

## Files Modified

1. `src/app/api/documents/route.ts` - Physical file deletion, deleted_at tracking
2. `src/app/api/users/route.ts` - User folder deletion
3. `src/app/api/cleanup/route.ts` - NEW - Auto-purge endpoint
4. `CLEANUP_SETUP.md` - NEW - Setup documentation
5. `ENV_SETUP.md` - NEW - Environment variables guide

## Next Steps

1. ✅ Add `CLEANUP_SECRET` to your `.env.local`
2. ✅ Test document deletion to verify files are removed
3. ✅ Set up automated cleanup (choose method from CLEANUP_SETUP.md)
4. ✅ Monitor logs to ensure cleanup runs successfully
5. ⚠️ Consider implementing email notifications for cleanup results
6. ⚠️ Add metrics/dashboard for tracking deleted items

## Rollback Plan

If you need to disable auto-cleanup:
1. Don't set up the cron job
2. Files will remain in trash indefinitely
3. Manual cleanup still available via API

To revert to hard delete (no trash):
1. Remove `?permanent=true` check in DELETE handler
2. Always delete files immediately
3. Not recommended - users prefer trash/restore functionality
