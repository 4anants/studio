# Document PIN Security Feature

## Overview

Added a 4-digit PIN system for viewing and downloading documents, providing an extra layer of security for sensitive files.

---

## Features

### ✅ For Users

1. **First-Time Setup**
   - When user tries to view/download a document for the first time
   - Prompted to set a 4-digit PIN
   - PIN is required for all future document access

2. **PIN Verification**
   - Enter PIN to view or download documents
   - 5 attempts allowed before lockout
   - 15-minute lockout after too many failed attempts

3. **Change PIN**
   - Users can change their PIN anytime
   - Must enter current PIN to set new one
   - New PIN must be 4 digits

4. **Security Features**
   - PIN is hashed (bcrypt) - never stored in plain text
   - Failed attempt tracking
   - Temporary account lockout
   - Countdown timer during lockout

### ✅ For Admins

1. **Reset User PIN**
   - Admin can reset any user's PIN
   - User will be prompted to set new PIN
   - Admin CANNOT see or set the PIN (only reset)

2. **No Admin Override**
   - Admins cannot bypass PIN requirement
   - Admins cannot view user PINs
   - Only users know their own PINs

---

## Database Schema

### New Columns in `users` Table

```sql
document_pin VARCHAR(255) NULL          -- Hashed PIN
pin_set BOOLEAN DEFAULT 0               -- Whether PIN is set
failed_pin_attempts INT DEFAULT 0       -- Failed attempt counter
pin_locked_until TIMESTAMP NULL         -- Lockout expiry time
```

**Auto-Repair:** These columns are added automatically when needed.

---

## API Endpoints

### 1. Check PIN Status
```
GET /api/document-pin
```

**Response:**
```json
{
  "pinSet": true,
  "isLocked": false,
  "lockedUntil": null,
  "failedAttempts": 0
}
```

### 2. Set/Change PIN
```
POST /api/document-pin
Body: { "pin": "1234", "currentPin": "5678" }
```

**For first-time setup:**
```json
{ "pin": "1234" }
```

**For changing PIN:**
```json
{ "pin": "1234", "currentPin": "5678" }
```

### 3. Verify PIN
```
PATCH /api/document-pin
Body: { "pin": "1234" }
```

**Success Response:**
```json
{
  "success": true,
  "message": "PIN verified successfully"
}
```

**Failed Response:**
```json
{
  "error": "Incorrect PIN. 4 attempt(s) remaining.",
  "attemptsLeft": 4
}
```

**Locked Response:**
```json
{
  "error": "Too many failed attempts. Try again in 15 minute(s).",
  "locked": true,
  "lockedUntil": "2025-12-14T22:15:00.000Z"
}
```

### 4. Admin Reset PIN
```
DELETE /api/document-pin?userId=user-123
```

**Admin only.** Resets user's PIN completely.

---

## React Components

### 1. PinSetupDialog

**Usage:**
```tsx
import { PinSetupDialog } from '@/components/dashboard/pin-setup-dialog';

<PinSetupDialog
  open={showSetup}
  onOpenChange={setShowSetup}
  onSuccess={() => {
    // PIN set successfully
    console.log('PIN configured');
  }}
  isChanging={false} // true if changing existing PIN
/>
```

**Features:**
- 4-digit numeric input
- Confirmation field
- Current PIN required when changing
- Validation and error handling

### 2. PinVerifyDialog

**Usage:**
```tsx
import { PinVerifyDialog } from '@/components/dashboard/pin-verify-dialog';

<PinVerifyDialog
  open={showVerify}
  onOpenChange={setShowVerify}
  onSuccess={() => {
    // PIN verified, proceed with action
    viewDocument();
  }}
  documentName="Passport.pdf"
  action="view" // or "download"
/>
```

**Features:**
- Attempt tracking
- Lockout timer
- Auto-focus on input
- Clear error messages

---

## Implementation Flow

### User Flow: First Time

1. User clicks "View" or "Download" on a document
2. System checks if PIN is set
3. If not set → Show `PinSetupDialog`
4. User sets 4-digit PIN
5. PIN is hashed and saved
6. Document action proceeds

### User Flow: Subsequent Access

1. User clicks "View" or "Download"
2. System checks if PIN is set
3. If set → Show `PinVerifyDialog`
4. User enters PIN
5. System verifies PIN
6. If correct → Document action proceeds
7. If incorrect → Show error and attempts remaining
8. If too many failures → Lock for 15 minutes

### Admin Flow: Reset PIN

1. Admin goes to user profile
2. Clicks "Reset Document PIN"
3. Confirms action
4. User's PIN is cleared
5. User will be prompted to set new PIN on next document access

---

## Security Features

### 1. PIN Hashing
- PINs are hashed using bcrypt (10 rounds)
- Never stored in plain text
- Cannot be reversed or viewed

### 2. Rate Limiting
- Maximum 5 attempts
- 15-minute lockout after 5 failed attempts
- Counter resets on successful verification

### 3. Lockout Timer
- Visual countdown during lockout
- Prevents brute force attacks
- Auto-unlocks after time expires

### 4. Admin Restrictions
- Admins can only reset PINs
- Admins cannot set or view PINs
- Users must set their own PINs

---

## Integration Guide

### Step 1: Add to Document View/Download

```tsx
import { useState, useEffect } from 'react';
import { PinSetupDialog } from '@/components/dashboard/pin-setup-dialog';
import { PinVerifyDialog } from '@/components/dashboard/pin-verify-dialog';

function DocumentList() {
  const [pinStatus, setPinStatus] = useState<any>(null);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinVerify, setShowPinVerify] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    const res = await fetch('/api/document-pin');
    const data = await res.json();
    setPinStatus(data);
  };

  const handleViewDocument = (doc: Document) => {
    const action = () => {
      // Your existing view logic
      window.open(doc.url, '_blank');
    };

    if (!pinStatus?.pinSet) {
      // First time - setup PIN
      setPendingAction(() => action);
      setShowPinSetup(true);
    } else {
      // Verify PIN
      setPendingAction(() => action);
      setShowPinVerify(true);
    }
  };

  const handlePinSetupSuccess = () => {
    checkPinStatus();
    pendingAction();
  };

  const handlePinVerifySuccess = () => {
    pendingAction();
  };

  return (
    <>
      {/* Your document list */}
      <button onClick={() => handleViewDocument(doc)}>
        View Document
      </button>

      <PinSetupDialog
        open={showPinSetup}
        onOpenChange={setShowPinSetup}
        onSuccess={handlePinSetupSuccess}
      />

      <PinVerifyDialog
        open={showPinVerify}
        onOpenChange={setShowPinVerify}
        onSuccess={handlePinVerifySuccess}
        documentName={selectedDoc?.name}
        action="view"
      />
    </>
  );
}
```

### Step 2: Add Admin Reset Button

```tsx
import { useToast } from '@/hooks/use-toast';

function UserProfile({ userId }: { userId: string }) {
  const { toast } = useToast();

  const handleResetPin = async () => {
    if (!confirm('Reset this user\'s document PIN? They will need to set a new one.')) {
      return;
    }

    try {
      const res = await fetch(`/api/document-pin?userId=${userId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to reset PIN');

      toast({
        title: 'PIN Reset',
        description: 'User will be prompted to set a new PIN on next document access.'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reset PIN'
      });
    }
  };

  return (
    <Button onClick={handleResetPin} variant="outline">
      Reset Document PIN
    </Button>
  );
}
```

---

## Testing

### Test 1: First-Time Setup
1. Login as a new user
2. Try to view a document
3. Should see PIN setup dialog
4. Set a 4-digit PIN
5. Document should open

### Test 2: PIN Verification
1. Logout and login again
2. Try to view a document
3. Should see PIN verification dialog
4. Enter correct PIN
5. Document should open

### Test 3: Failed Attempts
1. Try to view a document
2. Enter wrong PIN 5 times
3. Should see lockout message
4. Wait 15 minutes or check timer

### Test 4: Change PIN
1. Go to profile settings
2. Click "Change Document PIN"
3. Enter current PIN
4. Enter new PIN twice
5. Should update successfully

### Test 5: Admin Reset
1. Login as admin
2. Go to user profile
3. Click "Reset Document PIN"
4. Logout and login as that user
5. Try to view document
6. Should prompt for new PIN setup

---

## Configuration

### Adjust Lockout Settings

In `/api/document-pin/route.ts`:

```typescript
// Change max attempts (default: 5)
const maxAttempts = 5;

// Change lockout duration (default: 15 minutes)
const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
```

### Customize PIN Length

Currently fixed at 4 digits. To change:

1. Update validation in API: `/^\d{4}$/` → `/^\d{6}$/`
2. Update `maxLength` in components: `maxLength={4}` → `maxLength={6}`
3. Update user messages

---

## Troubleshooting

### Issue: "PIN not set" error
**Solution:** User needs to set PIN first. Show setup dialog.

### Issue: Account locked
**Solution:** Wait for lockout timer to expire (15 minutes).

### Issue: Can't change PIN
**Solution:** Verify current PIN is correct.

### Issue: Admin can't reset PIN
**Solution:** Check admin role in session.

---

## Security Best Practices

1. **Never log PINs** - Even in debug mode
2. **Use HTTPS** - Protect PIN transmission
3. **Regular audits** - Monitor failed attempts
4. **User education** - Don't share PINs
5. **Backup access** - Admin can reset if forgotten

---

## Future Enhancements

- [ ] PIN complexity requirements
- [ ] Biometric authentication option
- [ ] Email notification on failed attempts
- [ ] PIN expiry (force change every X months)
- [ ] Different PINs for different document types
- [ ] Audit log of PIN usage

---

**Last Updated:** 2025-12-14
**Version:** 1.0.0
