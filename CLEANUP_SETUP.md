# Auto-Cleanup Configuration

This document explains how to set up automatic cleanup of deleted items.

## Overview

The system now includes:
1. **Physical file deletion** when documents are permanently deleted
2. **User folder deletion** when users are deleted
3. **Auto-purge** of deleted documents after 30 days

## Database Schema Changes

The system automatically adds these columns when needed:
- `documents.is_deleted` (BOOLEAN) - Marks documents as soft-deleted
- `documents.deleted_at` (TIMESTAMP) - Records when document was deleted

## Cleanup API Endpoint

**Endpoint**: `POST /api/cleanup?secret=YOUR_SECRET`

This endpoint:
- Permanently deletes documents that have been in trash for 30+ days
- Deletes physical files from the filesystem
- Cleans up folders for deleted users

## Setting Up Auto-Cleanup

### Option 1: Windows Task Scheduler

1. Open Task Scheduler
2. Create a new task:
   - **Trigger**: Daily at 2:00 AM
   - **Action**: Start a program
   - **Program**: `powershell.exe`
   - **Arguments**: 
     ```powershell
     -Command "Invoke-WebRequest -Uri 'http://localhost:3000/api/cleanup?secret=YOUR_SECRET_HERE' -Method POST"
     ```

### Option 2: Node.js Cron (Recommended for Development)

Install node-cron:
```bash
npm install node-cron
```

Create `src/lib/cleanup-cron.ts`:
```typescript
import cron from 'node-cron';

// Run cleanup daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const response = await fetch(`http://localhost:3000/api/cleanup?secret=${process.env.CLEANUP_SECRET}`, {
      method: 'POST'
    });
    const result = await response.json();
    console.log('Cleanup completed:', result);
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
});
```

Then import this in your main app file.

### Option 3: External Cron Service (Production)

Use services like:
- **Vercel Cron** (if deployed on Vercel)
- **GitHub Actions** (scheduled workflows)
- **EasyCron** or **cron-job.org**

Example GitHub Action (`.github/workflows/cleanup.yml`):
```yaml
name: Daily Cleanup
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Run cleanup
        run: |
          curl -X POST "https://your-domain.com/api/cleanup?secret=${{ secrets.CLEANUP_SECRET }}"
```

## Environment Variables

Add to your `.env` file:
```env
CLEANUP_SECRET=your-random-secret-key-here
```

Generate a secure secret:
```bash
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Or use any random string generator
```

## Manual Cleanup

You can also trigger cleanup manually by calling:
```bash
curl -X POST "http://localhost:3000/api/cleanup?secret=YOUR_SECRET"
```

## What Gets Deleted

### Documents (After 30 Days in Trash)
- Database record removed
- Physical file deleted from `public/uploads/{userId}/{docType}/{year}/{month}/`

### Users (When Deleted)
- All user's documents removed from database
- Entire user folder deleted: `public/uploads/{userId}/`
- User record removed from database

## Testing

To test the cleanup:
1. Soft delete a document
2. Manually update its `deleted_at` to 31 days ago:
   ```sql
   UPDATE documents SET deleted_at = DATE_SUB(NOW(), INTERVAL 31 DAY) WHERE id = 'test-doc-id';
   ```
3. Call the cleanup endpoint
4. Verify the document and file are gone

## Monitoring

Check your application logs for:
- `Deleted physical file: ...` - Successful file deletion
- `Deleted user folder: ...` - Successful folder deletion
- `Cleanup completed: X documents and Y user folders deleted` - Summary

## Security Notes

- The cleanup endpoint requires a secret key to prevent unauthorized access
- Keep your `CLEANUP_SECRET` secure and never commit it to version control
- Consider IP whitelisting for production environments
- Review cleanup logs regularly to ensure proper operation
