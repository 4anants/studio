# Azure AD / Microsoft Login - Troubleshooting Guide

## 🔴 Error: "Access Denied - You do not have permission to sign in"

This error occurs when Azure AD rejects the login attempt. Follow these steps to fix it:

---

## ✅ **Solution Steps**

### **Step 1: Verify Environment Variables**

Check your `.env.local` file has these variables:

```env
# Azure AD Configuration
AZURE_AD_CLIENT_ID=your-application-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret-value
AZURE_AD_TENANT_ID=your-tenant-id-or-common

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:9003
NEXTAUTH_SECRET=your-random-secret-key
```

**How to get these values:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Select your app (or create a new one)
4. **Client ID:** Found on the "Overview" page
5. **Tenant ID:** Found on the "Overview" page
6. **Client Secret:** Go to "Certificates & secrets" → "New client secret"

---

### **Step 2: Configure Redirect URIs in Azure Portal**

**CRITICAL:** The redirect URI must **exactly match** what NextAuth expects.

#### **For Development (localhost):**
```
http://localhost:9003/api/auth/callback/azure-ad
```

#### **For Production:**
```
https://yourdomain.com/api/auth/callback/azure-ad
```

**How to add Redirect URI:**
1. In Azure Portal, go to your App registration
2. Click **Authentication** in the left menu
3. Under **Platform configurations**, click **Add a platform**
4. Select **Web**
5. Add the redirect URI: `http://localhost:9003/api/auth/callback/azure-ad`
6. Check **ID tokens** under "Implicit grant and hybrid flows"
7. Click **Configure**
8. Click **Save**

---

### **Step 3: Grant API Permissions**

Your app needs permission to read user profiles.

**Required Permissions:**
- `User.Read` (Microsoft Graph)
- `openid`
- `profile`
- `email`

**How to grant permissions:**
1. In Azure Portal, go to your App registration
2. Click **API permissions** in the left menu
3. Click **Add a permission**
4. Select **Microsoft Graph**
5. Select **Delegated permissions**
6. Check these permissions:
   - `User.Read`
   - `openid`
   - `profile`
   - `email`
7. Click **Add permissions**
8. Click **Grant admin consent for [Your Organization]**

---

### **Step 4: Configure Supported Account Types**

Determine who can sign in to your app.

**Options:**
- **Single tenant:** Only users in your organization
- **Multi-tenant:** Users from any Azure AD organization
- **Multi-tenant + Personal:** Anyone with a Microsoft account

**How to configure:**
1. In Azure Portal, go to your App registration
2. Click **Authentication**
3. Under **Supported account types**, select appropriate option
4. If using **multi-tenant**, set `AZURE_AD_TENANT_ID=common` in `.env.local`
5. Click **Save**

---

### **Step 5: Restart Development Server**

After making changes, restart your server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🧪 **Testing Azure AD Login**

1. Navigate to `http://localhost:9003/login`
2. Click **"Sign in with Microsoft"** button
3. You should be redirected to Microsoft login page
4. Enter your credentials
5. Grant permissions if prompted
6. You should be redirected back to the dashboard

---

## 🔍 **Common Issues & Solutions**

### **Issue 1: "AADSTS50011: The redirect URI specified in the request does not match"**

**Solution:**
- Verify redirect URI in Azure Portal **exactly matches**: `http://localhost:9003/api/auth/callback/azure-ad`
- Check for trailing slashes (should NOT have one)
- Ensure protocol is `http://` for localhost (not `https://`)

### **Issue 2: "AADSTS65001: The user or administrator has not consented"**

**Solution:**
1. Go to Azure Portal → App registration → API permissions
2. Click **Grant admin consent for [Organization]**
3. Ensure `User.Read` permission is granted

### **Issue 3: "AADSTS700016: Application not found in the directory"**

**Solution:**
- Verify `AZURE_AD_CLIENT_ID` matches the Application (client) ID in Azure Portal
- Ensure you're using the correct tenant
- If multi-tenant, set `AZURE_AD_TENANT_ID=common`

### **Issue 4: "AADSTS7000215: Invalid client secret provided"**

**Solution:**
1. Generate a new client secret in Azure Portal
2. Copy the **Value** (not the Secret ID)
3. Update `AZURE_AD_CLIENT_SECRET` in `.env.local`
4. Restart the server

### **Issue 5: User can login but gets "Access Denied" in app**

**Solution:**
- Check if user exists in your database
- Verify auto-registration is working (check `auth.ts` signIn callback)
- Check browser console for errors
- Verify user has `status: 'active'` in database

---

## 📝 **Environment Variables Template**

Create/update your `.env.local` file:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# NextAuth
NEXTAUTH_URL=http://localhost:9003
NEXTAUTH_SECRET=generate-a-random-secret-here

# Azure AD (Microsoft Login)
AZURE_AD_CLIENT_ID=12345678-1234-1234-1234-123456789abc
AZURE_AD_CLIENT_SECRET=your~client~secret~value~here
AZURE_AD_TENANT_ID=common
# Use "common" for multi-tenant, or your specific tenant ID for single-tenant
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## 🔐 **Security Best Practices**

1. **Never commit `.env.local`** to version control
2. **Rotate client secrets** every 90 days
3. **Use different secrets** for dev/staging/production
4. **Enable MFA** for admin accounts
5. **Review API permissions** regularly
6. **Monitor sign-in logs** in Azure Portal

---

## 📊 **Debugging Checklist**

- [ ] Environment variables are set correctly
- [ ] Redirect URI matches exactly in Azure Portal
- [ ] API permissions are granted
- [ ] Admin consent is provided
- [ ] Supported account types are configured
- [ ] Development server is restarted
- [ ] Browser cache is cleared
- [ ] User exists in database (or auto-registration is enabled)
- [ ] No firewall blocking Azure AD endpoints

---

## 🆘 **Still Having Issues?**

### **Check Azure AD Sign-in Logs:**
1. Go to Azure Portal
2. Navigate to **Azure Active Directory** → **Sign-in logs**
3. Look for failed sign-in attempts
4. Check the error code and message

### **Enable Debug Logging:**

Add to `.env.local`:
```env
NEXTAUTH_DEBUG=true
```

This will show detailed logs in the terminal.

### **Test Azure AD Configuration:**

Use Microsoft's test tool:
```
https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize?
client_id={client-id}&
response_type=code&
redirect_uri=http://localhost:9003/api/auth/callback/azure-ad&
scope=openid profile email User.Read
```

Replace `{tenant-id}` and `{client-id}` with your values.

---

## 📞 **Support Resources**

- [NextAuth.js Azure AD Provider Docs](https://next-auth.js.org/providers/azure-ad)
- [Microsoft Identity Platform Docs](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Azure AD Error Codes](https://docs.microsoft.com/en-us/azure/active-directory/develop/reference-aadsts-error-codes)

---

**Last Updated:** 2025-12-18  
**NextAuth Version:** 4.x  
**Azure AD Provider:** Configured
