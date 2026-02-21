# SysTracker Deployment: Local Network (Windows PC)

When deploying SysTracker on a Windows PC with only an IP address (no domain), you have several options depending on your use case.

> ✅ **Good News**: Google OAuth is **completely optional**. SysTracker works perfectly with just username/password authentication for local/internal network deployments.

---

## Quick Start: Local Network (No OAuth)

**Fastest setup for internal use:**

1. **Install SysTracker** on Windows PC
2. **Leave OAuth blank** in `.env`:
   ```env
   # Google OAuth Configuration (OPTIONAL - Leave blank to disable)
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   GOOGLE_CALLBACK_URL=
   ```
3. **Start server**: Server will run without OAuth
4. **Login page**: Will only show username/password (no Google button)
5. **Access**: `http://192.168.1.100:3001/login`

**That's it!** No domain, no OAuth setup needed for internal use.

---

## Scenario 1: Internal Use Only (No Public Access)

**Best Option: Disable Google OAuth, Use Local Authentication**

### Configuration:

1. **Skip Google OAuth setup** - Don't configure `GOOGLE_CLIENT_ID` in `.env`

2. **Server will run on:**
   ```
   http://192.168.1.100:3001  (your local IP)
   or
   http://YOUR-PC-NAME:3001   (Windows hostname)
   ```

3. **Users login with:**
   - Username/password authentication only
   - Create users via admin panel

4. **Agent configuration** (`agent_config.json`):
   ```json
   {
     "server_url": "http://192.168.1.100:3001",
     "agent_name": "WorkstationName"
   }
   ```

### Pros:
- ✅ Simple setup, no domain needed
- ✅ Works on local network immediately
- ✅ No external dependencies

### Cons:
- ⚠️ HTTP only (not HTTPS)
- ⚠️ No Google login convenience
- ⚠️ Only accessible on local network

---

## Scenario 2: Accessible from Internet (Home/Small Office)

**Best Option: Dynamic DNS + Let's Encrypt SSL**

### Step 1: Get Free Domain (DuckDNS Example)

1. Go to [DuckDNS.org](https://www.duckdns.org)
2. Sign in with Google/GitHub
3. Create subdomain: `mycompany-systracker.duckdns.org`
4. Update token with your public IP (auto-update available)

### Step 2: Port Forwarding

Configure your router to forward:
```
External Port 443 → 192.168.1.100:3001 (your Windows PC)
External Port 80  → 192.168.1.100:3001 (for SSL renewal)
```

### Step 3: Install SSL Certificate (Windows)

**Option A: Use Caddy (Automatic HTTPS)**

1. Download [Caddy](https://caddyserver.com/download)
2. Create `Caddyfile`:
   ```
   mycompany-systracker.duckdns.org {
       reverse_proxy localhost:3001
   }
   ```
3. Run: `caddy run`
4. Caddy automatically gets Let's Encrypt SSL!

**Option B: Manual Certbot**

1. Install [Certbot for Windows](https://certbot.eff.org/)
2. Run:
   ```powershell
   certbot certonly --standalone -d mycompany-systracker.duckdns.org
   ```
3. Configure Node.js server to use certificates

### Step 4: Configure Google OAuth

In `.env`:
```env
GOOGLE_CALLBACK_URL=https://mycompany-systracker.duckdns.org/api/auth/google/callback
```

In Google Cloud Console:
```
Authorized JavaScript origins:
  https://mycompany-systracker.duckdns.org

Authorized redirect URIs:
  https://mycompany-systracker.duckdns.org/api/auth/google/callback
```

### Pros:
- ✅ Free domain and SSL
- ✅ Google OAuth works
- ✅ Accessible from anywhere

### Cons:
- ⚠️ Requires port forwarding
- ⚠️ Need public IP address
- ⚠️ Router configuration needed

---

## Scenario 3: Remote Access Without Port Forwarding

**Best Option: Cloudflare Tunnel**

### Step 1: Install Cloudflare Tunnel

1. Sign up at [Cloudflare.com](https://www.cloudflare.com) (free)
2. Download [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
3. Install on Windows:
   ```powershell
   # Download cloudflared.exe
   # Move to C:\Program Files\cloudflared\
   ```

### Step 2: Create Tunnel

```powershell
# Login
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create systracker

# Configure tunnel
cloudflared tunnel route dns systracker systracker.yourdomain.com

# Run tunnel
cloudflared tunnel --url http://localhost:3001
```

### Step 3: Configure OAuth

Use your Cloudflare tunnel URL:
```env
GOOGLE_CALLBACK_URL=https://systracker.yourdomain.com/api/auth/google/callback
```

### Pros:
- ✅ No port forwarding needed
- ✅ Free HTTPS included
- ✅ DDoS protection
- ✅ Works behind firewall

### Cons:
- ⚠️ Requires Cloudflare account
- ⚠️ External dependency
- ⚠️ Traffic routed through Cloudflare

---

## Scenario 4: Completely Offline/Air-Gapped Network

**Best Option: Local Domain with Self-Signed Certificate**

### Step 1: Local Domain Setup

Edit `C:\Windows\System32\drivers\etc\hosts` on all machines:
```
192.168.1.100  systracker.local
```

### Step 2: Generate Self-Signed Certificate

```powershell
# Using OpenSSL on Windows
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=systracker.local"
```

### Step 3: Configure Node.js for HTTPS

Update `server/server.js`:
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(3001, () => {
  console.log('HTTPS server running on port 3001');
});
```

### Step 4: Install Certificate on Clients

1. Double-click `cert.pem`
2. "Install Certificate" → "Local Machine"
3. Place in "Trusted Root Certification Authorities"

### Important:
- ⚠️ **Google OAuth will NOT work** (requires internet)
- ✅ Use username/password authentication only
- ✅ Self-contained, no external dependencies

### Pros:
- ✅ Completely offline
- ✅ No internet required
- ✅ HTTPS secured

### Cons:
- ⚠️ No Google OAuth
- ⚠️ Manual certificate installation
- ⚠️ Certificate expiry management

---

## Quick Decision Guide

| Your Situation | Recommended Solution | OAuth Support | Difficulty |
|----------------|---------------------|---------------|------------|
| **Internal network only** | Local IP + Password Auth | ❌ No | ⭐ Easy |
| **Need internet access** | DuckDNS + Let's Encrypt | ✅ Yes | ⭐⭐ Medium |
| **Behind firewall** | Cloudflare Tunnel | ✅ Yes | ⭐⭐ Medium |
| **Completely offline** | Self-signed cert + Local auth | ❌ No | ⭐⭐⭐ Hard |

---

## Configuration Examples

### Example 1: Local Network (HTTP)

**`.env`**
```env
PORT=3001
# No Google OAuth variables
```

**Agent config**
```json
{
  "server_url": "http://192.168.1.100:3001",
  "agent_name": "PC-01"
}
```

**Access URL**
```
http://192.168.1.100:3001/login
```

---

### Example 2: DuckDNS with OAuth

**`.env`**
```env
PORT=3001
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
GOOGLE_CALLBACK_URL=https://mycompany-systracker.duckdns.org/api/auth/google/callback
```

**Agent config**
```json
{
  "server_url": "https://mycompany-systracker.duckdns.org",
  "agent_name": "PC-01"
}
```

**Access URL**
```
https://mycompany-systracker.duckdns.org/login
```

---

### Example 3: Cloudflare Tunnel

**`.env`**
```env
PORT=3001
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
GOOGLE_CALLBACK_URL=https://systracker.yourdomain.com/api/auth/google/callback
```

**Run tunnel**
```powershell
cloudflared tunnel --url http://localhost:3001
```

**Access URL**
```
https://systracker.yourdomain.com/login
```

---

## Windows Firewall Configuration

For local network deployments, ensure Windows Firewall allows incoming connections:

```powershell
# Allow Node.js through firewall
New-NetFirewallRule -DisplayName "SysTracker Server" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow

# Or allow port 3001
New-NetFirewallRule -DisplayName "SysTracker Port" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

---

## Security Considerations

### For Local Network Deployments:
1. **Change default admin password immediately**
2. **Use strong passwords** for all users
3. **Keep server updated** regularly
4. **Limit network access** to trusted devices only

### For Internet-Facing Deployments:
1. **Always use HTTPS** (required for OAuth)
2. **Enable rate limiting** on login endpoints
3. **Use strong admin passwords**
4. **Keep SSL certificates up to date**
5. **Monitor access logs** regularly
6. **Consider VPN** for additional security

---

## Troubleshooting

### "Cannot access server from other computers"
**Fix:**
1. Check Windows Firewall settings
2. Verify server is listening on `0.0.0.0` not `127.0.0.1`
3. Test with: `telnet 192.168.1.100 3001` from another PC

### "Google OAuth not working on local IP"
**Problem:** Google OAuth requires HTTPS and domain name

**Fix:**
- Use DuckDNS or Cloudflare Tunnel (get free domain + HTTPS)
- Or disable OAuth and use password authentication

### "Self-signed certificate warning in browser"
**Fix:**
1. Install certificate on all client machines
2. Or add exception in browser (less secure)
3. Or use Let's Encrypt instead (requires domain)

---

## Support

For more help:
- **OAuth Setup**: See [GOOGLE-OAUTH-SETUP.md](./GOOGLE-OAUTH-SETUP.md)
- **Server Installation**: See [README.md](../README.md)
- **Agent Setup**: See [agent/BUILD_INSTRUCTIONS.md](../agent/BUILD_INSTRUCTIONS.md)
