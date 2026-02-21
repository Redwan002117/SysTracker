# SysTracker Authentication Modes

SysTracker supports two authentication modes that work together seamlessly:

## 🔐 Authentication Methods

### 1. Username/Password (Always Available)
- **Status**: Always enabled, cannot be disabled
- **How it works**: Traditional username and password login
- **Best for**: All deployments (local, internal, internet-facing)
- **Requirements**: None - works out of the box

### 2. Google OAuth (Optional)
- **Status**: Optional - enable or disable by configuration
- **How it works**: "Sign in with Google" button
- **Best for**: Internet-facing deployments with domain names
- **Requirements**: Domain name, Google Cloud credentials

---

## 🎛️ Configuration

### Mode 1: Username/Password Only (Default)

**When to use:**
- Local network deployments (no internet)
- Internal corporate networks
- Server only has IP address (e.g., `192.168.1.100`)
- Don't want external authentication dependencies

**Configuration (`server/.env`):**
```env
# Leave OAuth variables blank or comment them out
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
```

**Result:**
- Login page shows: Username/password fields only
- Google sign-in button: Hidden (automatically)
- Server log: `⚠ Google OAuth not configured`
- Users login with: Local username and password

---

### Mode 2: Username/Password + Google OAuth

**When to use:**
- Internet-facing deployments
- Have a domain name (e.g., `monitor.rico.bd`)
- Want to offer Google sign-in convenience
- Want to leverage Google Workspace accounts

**Configuration (`server/.env`):**
```env
# Set all three OAuth variables
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
GOOGLE_CALLBACK_URL=https://monitor.rico.bd/api/auth/google/callback
```

**Result:**
- Login page shows: Username/password fields + "Sign in with Google" button
- Server log: `✓ Google OAuth configured`
- Users can login with: Either username/password OR Google account

---

## 🔄 How It Works

### Backend Detection

```javascript
// server/server.js
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    // Enable Google OAuth routes
    console.log('✓ Google OAuth configured');
} else {
    // OAuth routes return 503 error
    console.log('⚠ Google OAuth not configured');
}
```

### Frontend Detection

```typescript
// dashboard/app/login/page.tsx
const [googleOAuthEnabled, setGoogleOAuthEnabled] = useState(false);

// Check OAuth status on mount
fetch('/api/auth/oauth-status')
    .then(r => r.json())
    .then(data => {
        setGoogleOAuthEnabled(data.google_oauth_enabled);
    });

// Conditionally render Google button
{googleOAuthEnabled && (
    <button onClick={handleGoogleSignIn}>
        Sign in with Google
    </button>
)}
```

---

## 🎯 User Experience

### With OAuth Disabled (Local Network)

```
┌──────────────────────────────────┐
│         SysTracker Login         │
├──────────────────────────────────┤
│ Username: [admin              ]  │
│ Password: [••••••••••         ]  │
│                                  │
│         [ Sign In ]              │
│                                  │
└──────────────────────────────────┘
```

**Clean, simple interface - no external dependencies**

---

### With OAuth Enabled (Internet)

```
┌──────────────────────────────────┐
│         SysTracker Login         │
├──────────────────────────────────┤
│ Username: [admin              ]  │
│ Password: [••••••••••         ]  │
│                                  │
│         [ Sign In ]              │
│                                  │
│      ── or continue with ──      │
│                                  │
│    [ 🔵 Sign in with Google ]   │
│                                  │
└──────────────────────────────────┘
```

**Flexible - users choose their preferred method**

---

## 🔧 Switching Between Modes

### Enable OAuth (Add Google Sign-In)

1. Get Google OAuth credentials ([guide](./GOOGLE-OAUTH-SETUP.md))
2. Add credentials to `server/.env`
3. Restart server: `sudo systemctl restart systracker-server`
4. Login page will automatically show Google button

### Disable OAuth (Remove Google Sign-In)

1. Comment out or clear OAuth variables in `server/.env`:
   ```env
   # GOOGLE_CLIENT_ID=
   # GOOGLE_CLIENT_SECRET=
   # GOOGLE_CALLBACK_URL=
   ```
2. Restart server: `sudo systemctl restart systracker-server`
3. Login page will automatically hide Google button

**No code changes needed** - the UI adapts automatically!

---

## 📊 Comparison

| Feature | Username/Password | Google OAuth |
|---------|------------------|--------------|
| **Always Available** | ✅ Yes | Optional |
| **Works Offline** | ✅ Yes | ❌ No (needs internet) |
| **Requires Domain** | ❌ No (works with IP) | ✅ Yes |
| **External Dependency** | ❌ None | ✅ Google Cloud |
| **Setup Complexity** | ⭐ Easy | ⭐⭐ Medium |
| **User Convenience** | Password to remember | One-click login |
| **Security** | Strong passwords needed | Delegated to Google |
| **Account Creation** | Admin creates users | Self-service signup |

---

## 🛡️ Security Considerations

### Username/Password Mode
- ✅ No external dependencies (more control)
- ✅ Works in air-gapped networks
- ⚠️ Users must create strong passwords
- ⚠️ Password reset requires email (SMTP)

### Google OAuth Mode
- ✅ Leverages Google's security infrastructure
- ✅ Multi-factor authentication (if user enables in Google)
- ✅ No password to manage for OAuth users
- ⚠️ Depends on Google service availability
- ⚠️ Requires internet connectivity

---

## 🔀 Mixed Account Types

Both authentication modes can coexist:

**Example Organization:**
- **Admin users**: Username/password (local accounts)
- **Regular users**: Google OAuth (self-service)
- **External contractors**: Google OAuth (temporary access)

**Account Types:**
```javascript
// Local account (username/password only)
{
    username: "admin",
    email: "admin@company.com",
    password_hash: "bcrypt_hash...",
    google_id: null,
    auth_provider: "local"
}

// OAuth account (Google sign-in only)
{
    username: "john_doe",
    email: "john@gmail.com",
    password_hash: null,
    google_id: "117594572694857293945",
    auth_provider: "google"
}

// Hybrid account (both methods work)
{
    username: "jane_smith",
    email: "jane@company.com",
    password_hash: "bcrypt_hash...",
    google_id: "104857293945117594572",
    auth_provider: "local"  // Original provider
}
```

---

## 🚀 Best Practices

### For Local/Internal Networks
1. **Disable OAuth** - Leave credentials blank
2. Use strong passwords
3. Enable HTTPS with self-signed cert (optional)
4. Consider VPN for remote access

### For Internet-Facing Deployments
1. **Enable OAuth** - Improves user experience
2. Get free domain (DuckDNS, Cloudflare)
3. Use Let's Encrypt SSL certificate
4. Keep both auth methods available (flexibility)

### For Enterprise Deployments
1. **Enable OAuth** with Google Workspace
2. Configure SSO if available
3. Use OAuth for end-users, password for admins
4. Implement IP whitelisting
5. Enable audit logging

---

## 📖 Related Documentation

- **[Google OAuth Setup Guide](./GOOGLE-OAUTH-SETUP.md)** - Complete OAuth configuration
- **[Google OAuth Quick Start](./GOOGLE-OAUTH-QUICKSTART.md)** - 5-minute setup
- **[Local Network Deployment](./DEPLOYMENT-LOCAL-NETWORK.md)** - IP-only deployments
- **[System Requirements](./SYSTEM-REQUIREMENTS.md)** - Prerequisites

---

## ❓ FAQ

### Q: Can I completely remove OAuth code?
**A:** No need - it's designed to be dormant when not configured. No performance impact.

### Q: What happens if I remove OAuth after users signed up with Google?
**A:** OAuth-only users won't be able to login. You'd need to:
1. Add passwords for those accounts via admin panel, OR
2. Keep OAuth enabled

### Q: Can I force all users to use OAuth?
**A:** No - username/password is always available for admin access and fallback.

### Q: Does disabling OAuth improve performance?
**A:** No measurable difference - OAuth routes simply return 503 when not configured.

### Q: Can I use other OAuth providers (GitHub, Microsoft)?
**A:** Not yet - only Google OAuth is currently supported. This may be added in future versions.

---

## 🆘 Troubleshooting

### Login page not showing Google button
**Check:**
1. Is `GOOGLE_CLIENT_ID` set in `.env`?
2. Is `GOOGLE_CLIENT_SECRET` set in `.env`?
3. Did you restart the server after adding credentials?
4. Check server logs for "✓ Google OAuth configured"

### "Google OAuth not configured" error
**This is normal** if you haven't set up OAuth. It means:
- Username/password login still works
- Google button won't appear (by design)
- No action needed unless you want to enable OAuth

### Google button appears but doesn't work
**Check:**
1. Domain is configured in Google Cloud Console
2. Redirect URI matches exactly
3. Both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

---

**Summary**: OAuth is a convenience feature, not a requirement. SysTracker works great with or without it! 🎉
