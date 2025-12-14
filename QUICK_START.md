# QUICK START - Backend Updates

## ⚡ Immediate Actions Required

### 1. Update Environment Variables (2 minutes)

Add to your `.env.local` file:

```env
# Add this new variable for cleanup
CLEANUP_SECRET=paste-random-secret-here
```

**Generate a random secret:**
```powershell
# PowerShell (Windows)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### 2. Restart Your Dev Server (30 seconds)

```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

### 3. Test Authentication (1 minute)

1. Open browser in **incognito mode**
2. Try to visit: `http://localhost:3000/dashboard`
3. ✅ Should redirect to login page
4. Login with your credentials
5. ✅ Should now access dashboard

---

## 🔄 Database Updates

### Option A: Automatic (Recommended - No Action Needed)
The app will **automatically** add missing columns when needed:
- `documents.is_deleted`
- `documents.deleted_at`
- `users.display_name`

**Just use the app normally!**

### Option B: Manual (Optional)
If you want to add columns now:

```bash
# Connect to MySQL
mysql -u root -p

# Use your database
USE filesafe;

# Add columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
```

---

## ✅ Verification Checklist

### Test 1: Authentication Works
- [ ] Cannot access `/dashboard` without login
- [ ] Login redirects to dashboard
- [ ] Logout works correctly

### Test 2: Role-Based Access
- [ ] Regular user cannot access admin features
- [ ] Admin can access admin panel
- [ ] URL parameter `?role=admin` doesn't work for non-admins

### Test 3: Data Isolation
- [ ] Users can only see their own documents
- [ ] Users cannot view other users' profiles
- [ ] Admins can see all data

### Test 4: Document Deletion
- [ ] Delete button moves document to trash
- [ ] Deleted documents appear in "Deleted Items"
- [ ] Can restore deleted documents
- [ ] Can permanently delete from trash

---

## 🚀 What Changed

### Security (CRITICAL)
✅ All pages now require authentication
✅ All API endpoints protected
✅ Role-based access control enforced
✅ Users can only see their own data

### Features
✅ Soft delete for documents (30-day trash)
✅ Physical file deletion on permanent delete
✅ User folder cleanup on user deletion
✅ Display name support for ID cards

---

## 📋 Files Changed

### New Files
- `src/middleware.ts` - Route protection
- `src/lib/auth-helpers.ts` - Auth utilities
- `src/app/api/cleanup/route.ts` - Auto-purge endpoint
- `database/migrations/001_security_and_cleanup.sql` - DB schema

### Modified Files
- All API routes - Added authentication
- Dashboard pages - Server-side auth
- Document routes - Soft delete logic
- User routes - Folder cleanup

---

## ⚠️ Known Issues & Solutions

### Issue: "Cannot access dashboard"
**Solution:** Clear browser cache and cookies, then login again

### Issue: "API returns 401"
**Solution:** Restart dev server, verify `NEXTAUTH_SECRET` is set

### Issue: "Column doesn't exist"
**Solution:** Auto-repair will fix on next API call, or run manual SQL

---

## 🆘 Need Help?

### Quick Fixes
1. **Restart dev server** - Solves 80% of issues
2. **Clear browser cache** - Fixes auth issues
3. **Check `.env.local`** - Verify all variables set
4. **Check console logs** - Look for error messages

### Documentation
- `BACKEND_UPDATE_GUIDE.md` - Complete guide
- `SECURITY_FIXES.md` - Security changes
- `SECURITY_AUDIT.md` - Detailed audit

### Still Stuck?
1. Check error in browser console (F12)
2. Check server logs in terminal
3. Verify database connection
4. Review environment variables

---

## 🎯 Next Steps

### Immediate (Today)
1. ✅ Add `CLEANUP_SECRET` to `.env.local`
2. ✅ Restart dev server
3. ✅ Test authentication
4. ✅ Test document deletion

### Soon (This Week)
1. Set up automated cleanup (see `CLEANUP_SETUP.md`)
2. Test all security features
3. Review user permissions
4. Monitor for issues

### Later (This Month)
1. Deploy to production
2. Set up monitoring
3. Configure backups
4. Security audit

---

## ✨ Summary

**What You Need to Do NOW:**
1. Add `CLEANUP_SECRET` to `.env.local`
2. Restart dev server
3. Test login/authentication

**What Happens Automatically:**
- Database columns added as needed
- Authentication enforced
- Data isolation applied
- Soft delete enabled

**Everything should work immediately after restart!**

---

**Time Required:** 5 minutes
**Difficulty:** Easy
**Impact:** Critical security improvements
