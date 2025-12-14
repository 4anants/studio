# LOGOUT PORT FIX

## ✅ Fix Summary

The logout redirect issue has been fixed by forcing the application to use the current browser's origin (port included) instead of relying on the server-side `NEXTAUTH_URL` configuration which was defaulting to port 3000.

### 🛠 Changes Made

1.  **`src/components/dashboard/header.tsx`**: 
    - Updated `handleLogout` to use `window.location.origin`.
    - Updated the auto-logout logic (in `useEffect`) to use `window.location.origin`.

2.  **`src/components/login-form.tsx`**:
    - Updated `signInWithMicrosoft` to use `window.location.origin`.

### 🔍 How it works now

Instead of:
`http://localhost:3000/login` (Hardcoded/Default)

It now does:
`${window.location.origin}/login` -> `http://localhost:9002/login`

This ensures that the redirection always respects the port you are currently running on.

## 🧪 Verification Steps

1.  Refresh the page at `http://localhost:9002/dashboard`.
2.  Click on the **User Avatar** in the top right.
3.  Select **Logout**.
4.  Verify that the browser redirects to `http://localhost:9002/login` and **NOT** `http://localhost:3000/login`.
