# Unified Authentication System

**Version:** 3.3.1  
**Feature:** Account Merging by Email  
**Status:** ✅ Production Ready

---

## Overview

SysTracker now supports **unified authentication** where a single email address can use multiple login methods:
- **Username/Password** (manual login)
- **Google OAuth** (single sign-on)

This provides **resilience**: if Google OAuth is unavailable, users can still login using their username and password.

---

## Key Features

### ✅ Same Email, Multiple Methods

Users can authenticate with the **same email address** using:
1. Username + password
2. Google account

**Example:**
```
Email: john@company.com

Authentication Methods:
├─ Username/Password: ✅ Available
└─ Google OAuth: ✅ Linked

Login Options:
├─ Option 1: Username "john_doe" + password
└─ Option 2: "Sign in with Google"
```

### ✅ Backup Authentication

**Scenario:** Google OAuth service outage  
**Solution:** Users with backup passwords can still login manually

**Flow:**
```
1. OAuth-only user signs up with Google
   ↓
2. User sets backup password (no current password needed)
   ↓
3. Account now has BOTH methods
   ↓
4. If OAuth fails → Manual login still works! ✅
```

### ✅ Bi-Directional Linking

**Path 1: Password Account → Add OAuth**
- User has password-only account
- Logs in with Google (same email)
- Google account linked automatically
- Can now use either method

**Path 2: OAuth Account → Add Password**
- User has OAuth-only account
- Sets backup password in Profile
- Can now use either method

---

## Database Schema

```sql
CREATE TABLE admin_users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,          -- Primary identifier
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,                   -- NULL if OAuth-only
    google_id TEXT UNIQUE,                -- NULL if password-only
    auth_provider TEXT,                   -- 'local' or 'google' (original signup)
    display_name TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);
```

**Auth Method Detection:**
- `password_hash IS NOT NULL` → Username/password available
- `google_id IS NOT NULL` → Google OAuth available
- Both NOT NULL → Unified account (both methods work)

---

## Authentication Flows

### Flow 1: OAuth Login with Existing Email

```javascript
// User clicks "Sign in with Google"
Google OAuth → Returns email, google_id, profile
  ↓
Database Lookup:
SELECT * FROM admin_users 
WHERE google_id = ? OR email = ?
  ↓
Case 1: Google ID found → Login existing OAuth user
Case 2: Email found (no google_id) → Link Google account
Case 3: Nothing found → Create new OAuth user
```

**Account Linking Logic:**
```javascript
if (existingUser && !existingUser.google_id) {
    // Password-only account exists with this email
    // Link Google account WITHOUT overriding auth_provider
    db.run(`
        UPDATE admin_users 
        SET google_id = ?, 
            avatar = COALESCE(?, avatar), 
            display_name = COALESCE(?, display_name) 
        WHERE id = ?
    `, [googleId, avatar, displayName, existingUser.id]);
    
    console.log(`[OAuth] Linked Google account to: ${email}`);
}
```

**Key Points:**
- ✅ Preserves original `auth_provider` (doesn't override 'local' → 'google')
- ✅ Uses `COALESCE` to keep existing avatar/display_name if present
- ✅ Audit log records account linking event

### Flow 2: Password Login

```javascript
// User submits username/email + password
Login Form → Sends credentials
  ↓
Database Lookup:
SELECT * FROM admin_users 
WHERE (username = ? OR email = ?) 
  AND password_hash IS NOT NULL
  ↓
bcrypt.compare(password, user.password_hash)
  ↓
Match → Generate JWT token → Login success
```

**Works for:**
- ✅ Password-only accounts
- ✅ Unified accounts (OAuth + password)
- ❌ OAuth-only accounts (no password_hash)

### Flow 3: Setting Backup Password (OAuth-only users)

```javascript
// OAuth-only user wants backup authentication
Profile Page → "Set Password" section
  ↓
Check: user.password_hash === NULL
  ↓
Form: New Password + Confirm (NO current password field)
  ↓
API: POST /api/auth/change-password
{
    "new_password": "securePassword123"
    // No current_password needed (they don't have one)
}
  ↓
Server Logic:
if (!user.password_hash) {
    // OAuth-only user - allow setting initial password
    bcrypt.hash(new_password, 12, (err, hash) => {
        db.run('UPDATE admin_users SET password_hash = ? WHERE id = ?', 
               [hash, user.id]);
        
        logAudit(user.username, user.id, 'password_set', null, 
                 'Initial password set (OAuth)', req.ip);
        
        res.json({ 
            success: true, 
            message: 'Password set successfully. You can now login with either Google or username/password.' 
        });
    });
}
```

**Security:**
- ✅ No current password required (OAuth-only users don't have one)
- ✅ Audit log differentiates `password_set` vs `password_change`
- ✅ Success message confirms dual-method capability

### Flow 4: Changing Password (Existing password users)

```javascript
// User with existing password wants to update it
Profile Page → "Update Password" section
  ↓
Check: user.password_hash !== NULL
  ↓
Form: Current Password + New Password + Confirm
  ↓
API: POST /api/auth/change-password
{
    "current_password": "oldPassword",
    "new_password": "newPassword123"
}
  ↓
Server Logic:
if (user.password_hash) {
    // Has existing password - require current password (SECURITY)
    if (!current_password) {
        return res.status(400).json({ 
            error: 'current_password is required when updating password' 
        });
    }
    
    bcrypt.compare(current_password, user.password_hash, (err, match) => {
        if (!match) {
            return res.status(401).json({ 
                error: 'Current password is incorrect' 
            });
        }
        
        // Update password
        bcrypt.hash(new_password, 12, (err, hash) => {
            db.run('UPDATE admin_users SET password_hash = ? WHERE id = ?', 
                   [hash, user.id]);
            
            logAudit(user.username, user.id, 'password_change', null, 
                     'Password changed', req.ip);
            
            res.json({ success: true, message: 'Password changed successfully' });
        });
    });
}
```

**Security:**
- ✅ Current password **required** for existing password users
- ✅ Prevents unauthorized password changes if session stolen
- ✅ Standard security best practice maintained

---

## Profile UI Adaptation

The Profile page **automatically detects** which authentication methods are active and adapts the UI accordingly.

### Authentication Methods Badge

```typescript
// Fetch user profile
const data = await fetchProfile();
const hasPassword = !!data.user.password_hash;
const googleLinked = !!data.user.google_id;

// Display active methods
<div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
    <h3>Authentication Methods</h3>
    <div className="flex gap-2">
        {hasPassword && (
            <span className="badge">
                <LockIcon /> Username/Password
            </span>
        )}
        {googleLinked && (
            <span className="badge">
                <GoogleIcon /> Google Account
            </span>
        )}
    </div>
    
    {/* Helpful tip for OAuth-only users */}
    {!hasPassword && googleLinked && (
        <p className="text-sm text-blue-700 mt-2">
            💡 Set a password to enable username/password login as backup
        </p>
    )}
</div>
```

**Visual Examples:**

**Password-only account:**
```
┌─────────────────────────────────┐
│ Authentication Methods          │
├─────────────────────────────────┤
│ 🔒 Username/Password            │
└─────────────────────────────────┘
```

**OAuth-only account:**
```
┌─────────────────────────────────┐
│ Authentication Methods          │
├─────────────────────────────────┤
│ 🌐 Google Account               │
│                                 │
│ 💡 Set a password to enable     │
│    username/password login      │
│    as backup                    │
└─────────────────────────────────┘
```

**Unified account:**
```
┌─────────────────────────────────┐
│ Authentication Methods          │
├─────────────────────────────────┤
│ 🔒 Username/Password            │
│ 🌐 Google Account               │
└─────────────────────────────────┘
```

### Conditional Password Form

```typescript
const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const body: { current_password?: string; new_password: string } = {
        new_password: newPassword
    };
    
    // Only include current_password if user has existing password
    if (hasPassword && currentPassword) {
        body.current_password = currentPassword;
    }
    
    const response = await fetchWithAuth('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(body)
    });
    
    // Handle response...
};
```

**Form Rendering:**

**For OAuth-only users (hasPassword = false):**
```tsx
<form onSubmit={handleChangePassword}>
    <h2>Set Password</h2>
    <p>Add a backup authentication method</p>
    
    {/* NO current password field */}
    
    <div>
        <label>New Password *</label>
        <input type="password" required />
    </div>
    
    <div>
        <label>Confirm Password *</label>
        <input type="password" required />
    </div>
    
    <button type="submit">Set Password</button>
</form>
```

**For users with existing password (hasPassword = true):**
```tsx
<form onSubmit={handleChangePassword}>
    <h2>Update Password</h2>
    
    {/* Current password required */}
    <div>
        <label>Current Password *</label>
        <input type="password" required={hasPassword} />
    </div>
    
    <div>
        <label>New Password *</label>
        <input type="password" required />
    </div>
    
    <div>
        <label>Confirm Password *</label>
        <input type="password" required />
    </div>
    
    <button type="submit">Update Password</button>
</form>
```

---

## Security Considerations

### ✅ Email Uniqueness Enforced

**Database constraint:**
```sql
email TEXT UNIQUE NOT NULL
```

**Behavior:**
- One email = one account (with potentially multiple auth methods)
- OAuth signup with existing email → Links to existing account (doesn't create duplicate)
- Password signup with existing email → Rejected (email already in use)

**Rationale:**
- Prevents account fragmentation
- Ensures user data consistency
- Standard authentication best practice

### ✅ Password Security Maintained

**For existing password users:**
- Current password **REQUIRED** when changing password
- Protects against session hijacking
- Standard security practice unchanged

**For OAuth-only users:**
- Current password **NOT REQUIRED** when setting initial password
- Logical: they don't have a current password
- Still secure: requires authenticated session (JWT token)

### ✅ Account Linking Only on Login

**When account linking happens:**
- ✅ During OAuth login (user explicitly logs in with Google)
- ✅ User authenticated by Google (verified email)
- ✅ Server trusts Google's authentication

**When account linking does NOT happen:**
- ❌ Password signup with same email (rejected - email taken)
- ❌ API endpoint (no direct linking API)
- ❌ Account merge requests (not implemented)

**Rationale:**
- OAuth login proves email ownership (Google verified)
- Safe to link accounts automatically
- No phishing/takeover risk

### ✅ Audit Logging

**Events logged:**
```javascript
// OAuth account linking
logAudit(username, userId, 'oauth_link', null, 
         'Linked Google account to existing user', ip);

// OAuth-only user sets password
logAudit(username, userId, 'password_set', null, 
         'Initial password set (OAuth)', ip);

// Existing user changes password
logAudit(username, userId, 'password_change', null, 
         'Password changed', ip);
```

**Audit trail provides:**
- Account linking events
- Password set vs change distinction
- IP addresses for security review
- Timestamps for forensics

---

## User Scenarios

### Scenario 1: OAuth-only User Adds Backup

**Initial State:**
```
User: jane@gmail.com
Methods: Google OAuth only
password_hash: NULL
google_id: "104857293945117"
```

**Steps:**
1. User logs in with Google
2. Visits Profile page
3. Sees: "💡 Set a password to enable username/password login as backup"
4. Clicks "Set Password" section
5. Form shows: New Password + Confirm (NO current password)
6. Sets password: "SecureBackup123"
7. Submits form

**Final State:**
```
User: jane@gmail.com
Methods: Google OAuth + Username/Password
password_hash: "bcrypt_hash..."
google_id: "104857293945117"
```

**Result:**
- ✅ Can login with Google
- ✅ Can login with username + password
- ✅ Resilient if OAuth unavailable

### Scenario 2: Password User Links Google

**Initial State:**
```
User: john@company.com
Methods: Username/Password only
password_hash: "bcrypt_hash..."
google_id: NULL
auth_provider: "local"
```

**Steps:**
1. User logs in with username + password
2. Later: Clicks "Sign in with Google" (same email)
3. Google authentication succeeds
4. Server detects existing account with email
5. Links Google account automatically

**Final State:**
```
User: john@company.com
Methods: Username/Password + Google OAuth
password_hash: "bcrypt_hash..."
google_id: "117594572694857"
auth_provider: "local" (PRESERVED)
```

**Result:**
- ✅ Can login with username + password
- ✅ Can login with Google
- ✅ Original auth_provider preserved
- ✅ Convenience + security

### Scenario 3: OAuth Service Outage

**Account State:**
```
User: sarah@startup.io
Methods: Google OAuth + Username/Password (backup)
password_hash: "bcrypt_hash..."
google_id: "103948572946512"
```

**Event:** Google OAuth service down

**User Experience:**
1. User clicks "Sign in with Google"
2. OAuth redirect fails (Google service unavailable)
3. User returns to login page
4. Sees username/password fields
5. Logs in manually: username "sarah_dev" + password
6. **Login succeeds** ✅

**Without backup password:**
- ❌ User locked out
- ❌ Cannot access system
- ❌ Business disruption

**With backup password:**
- ✅ User can login
- ✅ System access maintained
- ✅ Business continuity

---

## API Reference

### POST `/api/auth/change-password`

**Purpose:** Set or update user password

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
    "current_password": "currentPassword123",  // REQUIRED if user has existing password
    "new_password": "newPassword456"            // REQUIRED always
}
```

**Responses:**

**Success (OAuth-only user setting initial password):**
```json
{
    "success": true,
    "message": "Password set successfully. You can now login with either Google or username/password."
}
```

**Success (User changing existing password):**
```json
{
    "success": true,
    "message": "Password changed successfully"
}
```

**Error (Current password required but missing):**
```json
{
    "error": "current_password is required when updating an existing password"
}
```

**Error (Current password incorrect):**
```json
{
    "error": "Current password is incorrect"
}
```

**Error (New password too weak):**
```json
{
    "error": "Password must be at least 8 characters"
}
```

### GET `/api/auth/profile`

**Purpose:** Get current user profile including auth methods

**Authentication:** Required (JWT token)

**Response:**
```json
{
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@company.com",
        "display_name": "John Doe",
        "avatar": "https://lh3.googleusercontent.com/...",
        "role": "admin",
        "auth_provider": "local",
        "password_hash": "bcrypt_hash...",  // Present if user has password
        "google_id": "117594572694857",     // Present if Google linked
        "created_at": "2024-01-15T10:30:00Z",
        "last_login": "2024-01-20T14:22:00Z"
    }
}
```

**Auth Method Detection:**
```typescript
const hasPassword = !!data.user.password_hash;
const googleLinked = !!data.user.google_id;

if (!hasPassword && googleLinked) {
    // OAuth-only user
    showSetPasswordGuidance();
} else if (hasPassword && !googleLinked) {
    // Password-only user
    suggestGoogleLinking();
} else if (hasPassword && googleLinked) {
    // Unified account
    showBothMethodsActive();
}
```

---

## Migration Notes

### Existing Accounts

**No migration required** ✅

**Existing password accounts:**
- Continue working unchanged
- Can link Google later by OAuth login
- `auth_provider` remains 'local'

**Existing OAuth accounts:**
- Continue working unchanged
- Can set backup password anytime
- `auth_provider` remains 'google'

### Database Compatibility

**Schema unchanged:**
- All fields already existed
- Just using fields differently
- No ALTER TABLE needed

**Data validation:**
```sql
-- Verify auth methods
SELECT 
    username,
    email,
    CASE 
        WHEN password_hash IS NOT NULL THEN 'Password'
        ELSE 'None'
    END AS password_auth,
    CASE 
        WHEN google_id IS NOT NULL THEN 'Google'
        ELSE 'None'
    END AS oauth_auth,
    auth_provider
FROM admin_users;
```

---

## Testing Checklist

### OAuth-only → Password Backup

- [ ] Login with Google (OAuth-only account)
- [ ] Visit Profile page
- [ ] Verify "Set Password" section visible
- [ ] Verify NO current password field
- [ ] Set new password
- [ ] Logout
- [ ] Login with username + password → Should succeed
- [ ] Login with Google → Should still work

### Password-only → OAuth Link

- [ ] Login with username + password
- [ ] Logout
- [ ] Click "Sign in with Google" (same email)
- [ ] Google auth succeeds
- [ ] Redirected to dashboard
- [ ] Visit Profile page
- [ ] Verify both auth methods shown
- [ ] Logout
- [ ] Login with username + password → Should work
- [ ] Login with Google → Should work

### Password Change (Existing password)

- [ ] Login with account that has password
- [ ] Visit Profile page
- [ ] Verify "Update Password" section
- [ ] Verify current password field present
- [ ] Try changing without current password → Should fail
- [ ] Enter wrong current password → Should fail
- [ ] Enter correct current password + new password → Should succeed
- [ ] Logout
- [ ] Login with new password → Should work

### Audit Logging

- [ ] Check audit_log table after OAuth linking
- [ ] Check audit_log after password_set (OAuth-only user)
- [ ] Check audit_log after password_change (existing password)
- [ ] Verify event types correct
- [ ] Verify IP addresses logged

---

## FAQ

### Q: Can one email have multiple accounts?

**A:** No. One email = one account. But that account can have multiple authentication methods (password + OAuth).

### Q: What happens if I sign up with Google, then try password signup with same email?

**A:** Password signup will fail with "Email already in use". You can login with Google, then set a password in your Profile.

### Q: Can I remove the Google link after adding it?

**A:** Not currently implemented. Contact system administrator to manually remove `google_id` if needed.

### Q: What if I forget my password but have Google linked?

**A:** Just use "Sign in with Google". Your account remains accessible via OAuth.

### Q: Can I have multiple Google accounts linked?

**A:** No. One Google account per SysTracker account. The `google_id` field is unique.

### Q: Does linking Google change my username?

**A:** No. Username, email, and role remain unchanged. Only `google_id` and optionally avatar/display_name are updated.

### Q: Is it secure to auto-link accounts by email?

**A:** Yes. Google OAuth verifies email ownership before authentication completes. The server trusts Google's verification.

### Q: What if OAuth is disabled server-wide?

**A:** OAuth-only accounts will need an admin to manually set a password_hash in the database to regain access.

### Q: Can I use different emails for password and Google?

**A:** No. Email is the primary identifier. OAuth and password must use the same email to link to same account.

---

## Related Documentation

- [Google OAuth Setup](GOOGLE-OAUTH-SETUP.md) - Configure OAuth credentials
- [OAuth Quick Start](GOOGLE-OAUTH-QUICKSTART.md) - Fast OAuth setup guide
- [Authentication Modes](AUTHENTICATION-MODES.md) - Username vs OAuth comparison
- [Local Network Deployment](DEPLOYMENT-LOCAL-NETWORK.md) - Deploy without OAuth

---

## Changelog

**v3.3.1 (Current)**
- ✅ Added unified authentication support
- ✅ OAuth login auto-links to existing email accounts
- ✅ OAuth-only users can set backup password
- ✅ Profile UI adapts to show active auth methods
- ✅ Conditional current password requirement
- ✅ Audit logging for account linking and password events

---

**Last Updated:** January 2024  
**Maintained By:** SysTracker Development Team
