# Google OAuth Setup Guide

This guide will help you set up Google Sign-In for your SysTracker installation.

## Overview

Google OAuth allows users to sign in to SysTracker using their Google account, eliminating the need to create and remember separate passwords. Benefits include:

- ✅ **Simplified onboarding**: Users can sign in with one click
- ✅ **Enhanced security**: No passwords to manage or forget
- ✅ **Auto-populated profiles**: Name, email, and avatar from Google account
- ✅ **Seamless experience**: Works alongside traditional username/password login

## Prerequisites

- A Google account
- Admin access to your SysTracker server
- **Your SysTracker server must have a domain name** (e.g., `https://monitor.rico.bd`)

> ⚠️ **Important: Google OAuth Requires a Domain**  
> Google OAuth does NOT work with IP addresses (e.g., `192.168.1.100` or `203.0.113.45`).  
> 
> **If you only have an IP address**, you have two options:
> 1. **Get a free domain** - Use DuckDNS, No-IP, or Cloudflare Tunnel (see below)
> 2. **Skip OAuth** - Use username/password authentication only
> 
> 📖 **See**: [DEPLOYMENT-LOCAL-NETWORK.md](./DEPLOYMENT-LOCAL-NETWORK.md) for detailed guidance on IP-only deployments.

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name (e.g., "SysTracker OAuth")
4. Click **Create**
5. Wait for project creation to complete

---

## Step 2: Enable Google+ API (Optional but Recommended)

1. In the Google Cloud Console, select your project
2. Go to **APIs & Services** → **Library**
3. Search for "Google+ API"
4. Click on it and press **Enable**

> **Note**: This ensures you can access user profile information.

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace organization)
3. Click **Create**

### Fill in the required fields:

**App Information:**
- **App name**: `SysTracker`
- **User support email**: Your email address
- **App logo**: (Optional) Upload your SysTracker logo

**App Domain:**
- **Application home page**: `https://monitor.rico.bd` (your SysTracker URL)
- **Application privacy policy**: `https://monitor.rico.bd` (or your privacy policy URL)
- **Application terms of service**: `https://monitor.rico.bd` (or your ToS URL)

**Authorized domains:**
- Add your domain (e.g., `rico.bd`)

**Developer contact information:**
- Your email address

4. Click **Save and Continue**
5. On **Scopes** screen, click **Add or Remove Scopes**:
   - Select `.../auth/userinfo.email`
   - Select `.../auth/userinfo.profile`
   - Click **Update**
6. Click **Save and Continue**
7. On **Test users** (if External), you can add specific Google accounts for testing
8. Click **Save and Continue**
9. Review and click **Back to Dashboard**

---

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Select **Application type**: **Web application**
4. Enter **Name**: `SysTracker Web Client`

### Add Authorized JavaScript origins:

**For Development (localhost):**
```
http://localhost:3000
http://localhost:3001
```

**For Production:**
```
https://systracker.rico.bd
https://monitor.rico.bd
```

> 📝 **Note**: Add both your brand site and server domain. This allows OAuth to be initiated from either location.

### Add Authorized redirect URIs:

**For Development (localhost):**
```
http://localhost:3001/api/auth/google/callback
```

**For Production:**
```
https://monitor.rico.bd/api/auth/google/callback
```

> ⚠️ **Important**: The redirect URI must point to your server domain where the API endpoint is hosted!

5. Click **Create**
6. A popup will show your credentials:
   - **Client ID**: `123456789-abcdefg.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-abcdefghijklmnop`

7. **Copy both values** - you'll need them for configuration

---

## Step 5: Configure SysTracker Server

1. Open your SysTracker server's `.env` file:
   ```bash
   nano /path/to/SysTracker/server/.env
   ```

2. Add the following configuration:
   ```env
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
   GOOGLE_CALLBACK_URL=https://monitor.rico.bd/api/auth/google/callback
   ```

3. Replace the values:
   - `GOOGLE_CLIENT_ID`: Paste your Client ID from Step 4
   - `GOOGLE_CLIENT_SECRET`: Paste your Client Secret from Step 4
   - `GOOGLE_CALLBACK_URL`: Your production callback URL

4. Save the file and exit

---

## Step 6: Restart SysTracker Server

Restart the server to apply the new configuration:

```bash
# If using systemd
sudo systemctl restart systracker-server

# If using Docker
docker-compose restart server

# If running manually
# Stop the server (Ctrl+C) and start again:
cd /path/to/SysTracker/server
node server.js
```

**Verify Google OAuth is configured:**

Check the server logs for:
```
✓ Google OAuth configured
```

If you see:
```
⚠ Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)
```

Then double-check your `.env` file configuration.

---

## Step 7: Test Google Sign-In

1. Open your SysTracker login page:
   ```
   https://monitor.rico.bd/login
   ```

2. You should see:
   - Traditional username/password fields
   - A divider saying "or continue with"
   - **"Sign in with Google"** button with Google logo

3. Click **"Sign in with Google"**

4. You'll be redirected to Google's login page

5. Select your Google account or sign in

6. Review permissions and click **Continue**

7. You'll be redirected back to SysTracker dashboard

8. Check your profile - it should show:
   - Your Google display name
   - Your Google email
   - Your Google profile picture (avatar)

---

## How It Works

### First-Time Sign-In (New User):
1. User clicks "Sign in with Google"
2. User authenticates with Google
3. SysTracker creates a new admin account with:
   - Username: Generated from email (e.g., `john.doe`)
   - Email: From Google account
   - Display name: From Google account
   - Avatar: From Google profile picture
   - Auth provider: `google`
   - No password (OAuth-only account)
4. User is logged in and redirected to dashboard

### Returning User Sign-In:
1. User clicks "Sign in with Google"
2. User authenticates with Google
3. SysTracker finds existing account by Google ID or email
4. User is logged in and redirected to dashboard

### Linking Existing Account:
If a user with the same email already exists:
- The Google ID is added to their existing account
- They can now sign in with either:
  - Username/password (if password is set)
  - Google Sign-In

---

## Security Features

### OAuth-Only Accounts:
- Accounts created via Google don't have passwords
- If user tries to login with username/password:
  - Error: "This account uses Google Sign-In. Please sign in with Google."
  - Shows link to Google Sign-In

### Audit Logging:
All OAuth events are logged in the audit trail:
- `signup`: New user created via Google OAuth
- `login`: User logged in via Google OAuth
- Includes IP address and timestamp

### Password Protection:
- OAuth accounts have `password_hash = NULL`
- Traditional accounts can add Google Sign-In later
- Both auth methods can coexist

---

## Multi-Domain Architecture Explained

SysTracker uses a dual-domain setup:

**🌐 Brand Site**: `https://systracker.rico.bd`
- Portfolio/marketing site
- Installation instructions
- Redirects users to the app

**🖥️ Application Server**: `https://monitor.rico.bd`
- Actual SysTracker application
- API endpoints
- Dashboard & authentication

### Why Add Both Domains to Google OAuth?

```
Google OAuth Configuration:
┌─────────────────────────────────────────┐
│ Authorized JavaScript Origins:          │
│  ✅ https://systracker.rico.bd          │  ← Brand site (where users might start)
│  ✅ https://monitor.rico.bd             │  ← App server (where OAuth actually runs)
├─────────────────────────────────────────┤
│ Authorized Redirect URIs:               │
│  ✅ https://monitor.rico.bd/            │  ← Server callback (where OAuth returns)
│     api/auth/google/callback            │
└─────────────────────────────────────────┘
```

**User Flow:**
1. User visits `systracker.rico.bd` (brand site)
2. Clicks "Launch App" → redirects to `monitor.rico.bd/login`
3. Clicks "Sign in with Google" on `monitor.rico.bd`
4. Google authenticates → redirects to `monitor.rico.bd/api/auth/google/callback` ✅

**Benefits:**
- ✅ Google will approve this configuration (it's standard practice)
- ✅ Prevents CORS errors
- ✅ Works if users bookmark/share either domain
- ✅ Future-proof if you add OAuth to brand site

---

## Troubleshooting

### Error: "Google OAuth not configured"
**Cause**: Environment variables not set

**Solution**:
1. Verify `.env` file has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Restart server after adding variables
3. Check server logs for "✓ Google OAuth configured"

---

### Error: "redirect_uri_mismatch"
**Cause**: OAuth URLs don't match Google Cloud Console configuration

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Verify **Authorized JavaScript origins**:
   ```
   https://systracker.rico.bd
   https://monitor.rico.bd
   ```
4. Verify **Authorized redirect URIs**:
   ```
   https://monitor.rico.bd/api/auth/google/callback
   ```
5. Must match **exactly** (including `https://`, domain, and path)
6. Save and try again

> 💡 **Tip**: Origins and redirect URIs can be different domains. This is normal and Google allows it!

---

### Error: "No email address found"
**Cause**: Google account doesn't have email or email scope not granted

**Solution**:
1. Ensure OAuth consent screen requests email scope
2. User must grant email permission during sign-in
3. Google account must have verified email address

---

### Error: "This app isn't verified"
**Cause**: OAuth consent screen is in testing mode

**Solution**:
- **For testing**: Click "Advanced" → "Go to SysTracker (unsafe)" (safe if it's your app)
- **For production**: 
  1. Go to OAuth consent screen
  2. Click **Publish App**
  3. Submit for verification (if needed)
  4. Or add test users instead of publishing

---

### Google Sign-In button doesn't appear
**Cause**: Frontend not loading properly or server not configured

**Solution**:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Check browser console for errors
4. Verify dashboard was rebuilt: `cd dashboard && npm run build`

---

### User created but can't see any machines
**Cause**: New OAuth users have empty machine list

**Expected behavior**: This is normal for new accounts. OAuth users need to:
1. Add machines via agent installation
2. Or grant access by existing admins

---

## Multiple Domains / Development Setup

If you're running SysTracker on multiple domains (e.g., localhost + production):

1. Add all redirect URIs in Google Cloud Console:
   ```
   http://localhost:3001/api/auth/google/callback
   https://staging.yourdomain.com/api/auth/google/callback
   https://monitor.rico.bd/api/auth/google/callback
   ```

2. Set `GOOGLE_CALLBACK_URL` per environment:
   - Development `.env`: `http://localhost:3001/api/auth/google/callback`
   - Production `.env`: `https://monitor.rico.bd/api/auth/google/callback`

---

## Disabling Google OAuth

To disable Google Sign-In:

1. Remove or comment out in `.env`:
   ```env
   # GOOGLE_CLIENT_ID=...
   # GOOGLE_CLIENT_SECRET=...
   # GOOGLE_CALLBACK_URL=...
   ```

2. Restart server

3. Google Sign-In button will not appear on login page

4. Existing OAuth users can still login (their accounts remain)

---

## Managing OAuth Users

### Check if user uses OAuth:
```sql
SELECT username, email, google_id, auth_provider 
FROM admin_users 
WHERE auth_provider = 'google';
```

### Convert OAuth user to password auth:
1. User goes to Profile → Change Password
2. Sets new password
3. `auth_provider` remains `google` but password is now set
4. User can use either Google or password to login

### Remove Google linkage:
```sql
UPDATE admin_users 
SET google_id = NULL, auth_provider = 'local' 
WHERE username = 'example_user';
```

---

## Advanced Configuration

### Custom OAuth Scopes:
Edit `server/server.js` to request additional Google scopes:

```javascript
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email', 'openid'] // Add more scopes
}, ...));
```

### Custom User Role Assignment:
By default, all OAuth users get `role = 'admin'`. To customize:

Edit the user creation logic in `server/server.js` around line 740:

```javascript
// Change from:
db.run(`INSERT INTO admin_users (..., role, ...) VALUES (..., 'admin', ...)`, ...);

// To:
db.run(`INSERT INTO admin_users (..., role, ...) VALUES (..., 'viewer', ...)`, ...);
```

---

## Support

For additional help:
- Check server logs: `/path/to/SysTracker/server/logs/`
- Audit trail: Dashboard → Settings → Audit Logs
- GitHub Issues: https://github.com/Redwan002117/SysTracker/issues

---

## Summary Checklist

- [ ] Created Google Cloud Project
- [ ] Enabled Google+ API (optional)
- [ ] Configured OAuth consent screen
- [ ] Created OAuth 2.0 credentials
- [ ] Added authorized redirect URIs
- [ ] Copied Client ID and Secret
- [ ] Updated `.env` file
- [ ] Restarted SysTracker server
- [ ] Verified "✓ Google OAuth configured" in logs
- [ ] Tested Google Sign-In button appears
- [ ] Successfully signed in with Google account
- [ ] Verified user profile shows Google info

---

**🎉 Google OAuth is now active on your SysTracker installation!**
