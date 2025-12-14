# Environment Variables Setup

Add these to your `.env.local` file:

```env
# Cleanup Configuration
CLEANUP_SECRET=your-secure-random-secret-here
```

To generate a secure secret, use:

**PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Node.js:**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

**Online:**
Visit https://www.random.org/strings/ and generate a random string.

## Important
- Never commit your actual `.env` or `.env.local` file
- Keep the CLEANUP_SECRET secure
- Use different secrets for development and production
