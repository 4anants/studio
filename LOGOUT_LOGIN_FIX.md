# LOGOUT & LOGIN FIX - Troubleshooting

## Issue: Logout redirects to `/login` but page doesn't work

### ✅ FIXES APPLIED:

1. **Updated Middleware** - Now explicitly allows `/login` route
2. **Auth Callback** - Allows login page access without token
3. **NextAuth Config** - Has correct `signIn: '/login'` page

---

## 🧪 TEST THE FIX:

### Step 1: Clear Browser Data
```
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage:
   - Cookies
   - Local Storage
   - Session Storage
4. Close DevTools
5. Hard refresh (Ctrl + Shift + R)
```

### Step 2: Test Login
```
1. Go to http://localhost:3000
2. Should redirect to http://localhost:3000/login
3. Login page should load
4. Enter credentials and login
5. Should redirect to dashboard
```

### Step 3: Test Logout
```
1. Click on your avatar (top right)
2. Click "Logout"
3. Should redirect to http://localhost:3000/login
4. Login page should load
5. You should be logged out
```

---

## 🔍 IF STILL NOT WORKING:

### Check 1: Verify Login Page Loads Directly
```
Visit: http://localhost:3000/login
Expected: Login page shows
If not: There's a routing issue
```

### Check 2: Check Browser Console
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors
4. Common errors:
   - "Failed to fetch" - API issue
   - "Unauthorized" - Auth issue
   - "404" - Route not found
```

### Check 3: Check Network Tab
```
1. Open DevTools (F12)
2. Go to Network tab
3. Click logout
4. Look for:
   - POST to /api/auth/signout
   - Redirect to /login
   - GET /login (should be 200)
```

### Check 4: Verify Environment Variables
```
Check .env.local has:
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

---

## 🛠️ MANUAL FIX:

If automatic logout doesn't work, manually clear session:

### Option 1: Browser Console
```javascript
// Open console (F12)
localStorage.clear();
sessionStorage.clear();
location.href = '/login';
```

### Option 2: Incognito Mode
```
1. Open new incognito window
2. Go to http://localhost:3000/login
3. Should work fresh
```

---

## 📋 EXPECTED BEHAVIOR:

### Logout Flow:
```
1. User clicks "Logout" in dropdown
2. handleLogout() executes:
   - localStorage.removeItem('session')
   - signOut({ callbackUrl: '/login' })
3. NextAuth clears cookies
4. Browser redirects to /login
5. Login page loads
6. User can login again
```

### Login Page Should Show:
```
- Company logo
- Company name
- "Your secure internal document repository"
- Email input field
- Password input field
- "Sign In" button
```

---

## 🐛 COMMON ISSUES:

### Issue 1: Infinite Redirect Loop
**Symptom:** Page keeps redirecting
**Fix:** Clear all browser data and restart dev server

### Issue 2: 404 on /login
**Symptom:** "Page not found"
**Fix:** Check that `src/app/login/page.tsx` exists

### Issue 3: Blank Page
**Symptom:** White screen, no errors
**Fix:** Check browser console for JavaScript errors

### Issue 4: "Unauthorized" Error
**Symptom:** Can't access login page
**Fix:** Middleware is blocking it - already fixed in latest update

---

## 🔄 RESTART DEV SERVER:

Sometimes Next.js needs a restart:

```bash
# Stop server (Ctrl + C)
# Clear Next.js cache
Remove-Item -Path ".next" -Recurse -Force

# Restart
npm run dev
```

---

## ✅ VERIFICATION CHECKLIST:

After fixes, verify:

- [ ] Can access http://localhost:3000/login directly
- [ ] Login page loads with form
- [ ] Can login successfully
- [ ] Dashboard loads after login
- [ ] Can logout from dashboard
- [ ] Logout redirects to login page
- [ ] Login page loads after logout
- [ ] Can login again after logout

---

## 📞 IF STILL STUCK:

Provide this info:

1. **Browser Console Errors:** (screenshot or copy/paste)
2. **Network Tab:** (screenshot of failed requests)
3. **What happens:** Describe step by step
4. **Expected:** What should happen
5. **Actual:** What actually happens

---

**Most likely fix:** Clear browser cache and cookies, then try again!
