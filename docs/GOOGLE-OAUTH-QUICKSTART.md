# Google OAuth Quick Setup

Get Google Sign-In working in 5 minutes!

> 💡 **Note**: Google OAuth is **completely optional**. SysTracker works perfectly with username/password authentication alone.
> 
> **Skip OAuth if:**
> - ✅ Deploying on local/internal network only
> - ✅ Server only has IP address (no domain)
> - ✅ Prefer simple username/password login
> 
> **Use OAuth if:**
> - ✅ Internet-facing deployment with domain name
> - ✅ Want convenient "Sign in with Google" option
> - ✅ Already using Google Workspace

> ⚠️ **Important**: Google OAuth requires a **domain name** (not an IP address).  
> If your server only has an IP like `192.168.1.100`, see [DEPLOYMENT-LOCAL-NETWORK.md](./DEPLOYMENT-LOCAL-NETWORK.md) first.

---

## How OAuth Works (Optional)

When OAuth is **enabled**: Login page shows both username/password AND "Sign in with Google" button

When OAuth is **disabled**: Login page shows only username/password (Google button is hidden)

The system automatically detects if OAuth is configured and adjusts the UI accordingly.

---

## 1. Get Google Credentials (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: **"SysTracker OAuth"**
3. Go to **APIs & Services** → **OAuth consent screen**
   - Select **External**
   - App name: `SysTracker`
   - Your email, domain, etc.
   - Scopes: Add `email` and `profile`
   - Save
4. Go to **Credentials** → **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Type: **Web application**
   - Name: `SysTracker Web Client`
   - **Authorized JavaScript origins:**
     ```
     https://systracker.rico.bd
     https://monitor.rico.bd
     ```
     *(Add both your brand site and server domain)*
   - **Authorized redirect URIs:**
     ```
     https://monitor.rico.bd/api/auth/google/callback
     ```
     *(Your server callback URL)*
   - Click **Create**
5. **Copy** Client ID and Client Secret

## 2. Configure SysTracker

Edit `/path/to/SysTracker/server/.env`:

```env
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
GOOGLE_CALLBACK_URL=https://monitor.rico.bd/api/auth/google/callback
```

## 3. Restart Server

```bash
# Systemd
sudo systemctl restart systracker-server

# Docker
docker-compose restart server

# Manual
# Ctrl+C and restart: node server.js
```

Check logs for:
```
✓ Google OAuth configured
```

## 4. Test

1. Go to login page: `https://monitor.rico.bd/login`
2. Click **"Sign in with Google"** button
3. Authenticate with Google
4. You're in! ✅

---

## Troubleshooting

### "redirect_uri_mismatch"
**Fix**: Add **exact** URLs in Google Console → Credentials:

**Authorized JavaScript origins:**
```
https://systracker.rico.bd
https://monitor.rico.bd
```

**Authorized redirect URIs:**
```
https://monitor.rico.bd/api/auth/google/callback
```

### "OAuth not configured" error
**Fix**: Check `.env` file has all 3 variables, then restart server

### Button doesn't appear
**Fix**: Rebuild dashboard: `cd dashboard && npm run build`

---

For detailed setup: See [GOOGLE-OAUTH-SETUP.md](./GOOGLE-OAUTH-SETUP.md)
