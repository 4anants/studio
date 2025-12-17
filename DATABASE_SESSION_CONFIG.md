# Database & Session Configuration Summary

## 📊 **Connection Pool Configuration (300+ Users)**

### File: `src/lib/db.ts`

**Connection Pool Settings:**
```typescript
connectionLimit: 100  // Supports 300+ users with ~30-50 concurrent users
maxIdle: 20          // Keeps 20 idle connections ready
idleTimeout: 60000   // Closes idle connections after 60 seconds
connectTimeout: 10000 // Connection timeout: 10 seconds
```

### **Sizing Calculation:**
- **Total Users:** 300+
- **Concurrent Users (Peak):** ~10% = 30-50 users
- **Connection Formula:** `(concurrent_users × 2) + buffer`
- **Result:** 100 connections (provides 2x safety margin)

### **Why 100 Connections?**
- Each API request may use 1-2 connections
- Handles peak loads during login storms
- Provides buffer for background tasks
- Prevents "Too many connections" errors

---

## ⏱️ **Session Timeout Configuration**

### File: `src/lib/auth.ts`

**Role-Based Session Timeouts:**

| Role     | Timeout  | Milliseconds | Reason                    |
|----------|----------|--------------|---------------------------|
| Employee | 15 min   | 900,000 ms   | Security: Regular users   |
| Admin    | 180 min  | 10,800,000 ms| Convenience: Long tasks   |

### **How It Works:**

1. **Login Time Tracking:**
   - When user logs in, `loginTime` is stored in JWT token
   - Token includes: `userId`, `userRole`, `loginTime`

2. **Session Validation:**
   - On every request, current time is compared to `loginTime`
   - If `(now - loginTime) > timeout`, session expires
   - User is automatically logged out

3. **Automatic Logout:**
   - Expired sessions return `userId: null`
   - Frontend detects expired session
   - User is redirected to login page

### **Implementation Details:**

```typescript
// JWT Callback - Session Timeout Check
const timeout = role === 'admin' ? 10800000 : 900000;

if (now - loginTime > timeout) {
    return {
        ...token,
        userId: null,      // Clear user ID
        userRole: null,    // Clear role
        loginTime: null,   // Clear login time
    };
}
```

---

## 🔄 **Required Actions**

### **1. Restart Development Server**
The changes require a server restart to take effect:

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### **2. Verify MySQL Configuration**
Ensure your MySQL server supports 100+ connections:

```sql
-- Check current max_connections
SHOW VARIABLES LIKE 'max_connections';

-- If less than 150, increase it:
SET GLOBAL max_connections = 200;
```

### **3. Test Session Timeouts**

**Employee Test (15 min):**
1. Login as employee
2. Wait 15 minutes
3. Try to access any page
4. Should be redirected to login

**Admin Test (180 min):**
1. Login as admin
2. Wait 180 minutes
3. Try to access any page
4. Should be redirected to login

---

## 📈 **Performance Optimizations**

### **1. Metadata Caching**
- **File:** `src/app/layout.tsx`
- **Cache TTL:** 60 seconds
- **Benefit:** Reduces DB queries on every page load

### **2. Connection Pooling**
- **Reuses connections** instead of creating new ones
- **Idle timeout** closes unused connections
- **Keep-alive** maintains connection health

### **3. Session Management**
- **JWT-based** (no database lookups)
- **Stateless** (scales horizontally)
- **Automatic cleanup** (expired sessions)

---

## 🛠️ **Troubleshooting**

### **Issue: "Too many connections" still appears**

**Solution:**
1. Restart dev server: `npm run dev`
2. Check MySQL: `SHOW PROCESSLIST;`
3. Kill stuck connections: `KILL <process_id>;`
4. Increase MySQL max_connections if needed

### **Issue: Users not auto-logging out**

**Solution:**
1. Clear browser cookies
2. Check browser console for errors
3. Verify `NEXTAUTH_SECRET` is set in `.env`
4. Restart server to apply auth changes

### **Issue: Slow performance with 300 users**

**Solution:**
1. Increase `connectionLimit` to 150
2. Add database indexes on frequently queried columns
3. Implement Redis caching for sessions
4. Use CDN for static assets

---

## 📝 **Environment Variables**

Ensure these are set in your `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:9003
```

---

## ✅ **Summary of Changes**

| Component | Change | Impact |
|-----------|--------|--------|
| Connection Pool | 10 → 100 connections | Supports 300+ users |
| Employee Session | No timeout → 15 min | Better security |
| Admin Session | No timeout → 180 min | Balanced convenience |
| Metadata | No cache → 60s cache | Reduced DB load |
| Idle Connections | 10 → 20 | Faster response |

---

## 🎯 **Next Steps**

1. ✅ **Restart server** - Apply all changes
2. ✅ **Test login** - Verify both roles work
3. ✅ **Monitor connections** - Watch for errors
4. ✅ **Test timeouts** - Confirm auto-logout works
5. ✅ **Load test** - Simulate 50+ concurrent users

---

**Last Updated:** 2025-12-18  
**Configuration Version:** 2.0  
**Supports:** 300+ users, Role-based timeouts
