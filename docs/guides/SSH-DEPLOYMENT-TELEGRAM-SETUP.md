# SysTracker — SSH Deployment & Telegram Notifications Setup Guide

> **Server:** Ubuntu 25.10, CasaOS, hostname `RickyAdams2117`, user `rickyadams2117`
>
> **Tunnel:** SSH goes through Cloudflare Tunnel → `ssh.monitor.rico.bd` (not direct port 22)
>
> **"Dev container terminal"** means the **terminal inside VS Code** (the editor where you're reading this file). It's the black terminal panel at the bottom of VS Code — NOT your server terminal.

---

## Prerequisites

- SSH access to your server (local network or via Cloudflare Tunnel)
- Cloudflare Tunnel running on the server (`big-bear-cloudflared-web` container)
- Cloudflare Zero Trust hostname `ssh.monitor.rico.bd` → `ssh://192.168.10.8:22` configured
- GitHub Secrets set via `https://github.com/Redwan002117/SysTracker/settings/secrets/actions`
- Telegram bot already created via `@BotFather`

> ⚠️ The dev container's `GITHUB_TOKEN` is read-only — `gh secret set` won't work here. **Set all secrets via the GitHub web UI link above.**

---

## Part 0 — Key Security Status ✅ DONE

> ✅ Two generations of exposed keys were revoked. `github_deploy_final` is the current safe key.

**Verified state:**
- `~/.ssh/github_deploy` — exposed & deleted ✅
- `~/.ssh/github_deploy_new` — exposed & deleted ✅
- `~/.ssh/github_deploy_final` — safe key, permissions `600` ✅
- `~/.ssh/github_deploy_final.pub` — in `authorized_keys` ✅
- `.ssh/` directory — permissions `700` ✅
- Home directory — permissions `755` ✅

> ⚠️ If the Telegram bot token was also exposed, revoke it: Telegram → `@BotFather` → `/mybots` → select bot → **Revoke current token** → copy new token.

---

## Part 1 — Server Setup (on `monitor.rico.bd`)

### 1.1 — Generate a Dedicated Deploy SSH Key ✅ DONE

Already done. Key is at `~/.ssh/github_deploy_final`.

### 1.2 — Authorize the Key on the Server ✅ DONE

Already done. Public key (`github_deploy_final.pub`) is in `~/.ssh/authorized_keys`.

### 1.3 — Create Required Directories ✅ DONE

Already done:
```
/home/rickyadams2117/backups
/home/rickyadams2117/server/dashboard-dist
```

### 1.4 — Fix SSH Config ✅ DONE

Verified output:
```
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys .ssh/authorized_keys2
```

SSH was restarted successfully. Key authentication is enabled.

### 1.5 — Cloudflare Tunnel SSH Hostname ✅ CONFIGURED

The Cloudflare Tunnel routes `ssh.monitor.rico.bd` → `ssh://192.168.10.8:22`.

> ⚠️ **Action required:** In Cloudflare Zero Trust → Networks → Tunnels → edit tunnel → Public Hostnames → edit `ssh.monitor.rico.bd` → **clear the Path field** (must be empty, not `^/blog`) → Save.

The tunnel container (`big-bear-cloudflared-web`) must be running on the server. Verify:
```bash
docker ps | grep cloudflared
```

### 1.6 — CasaOS SysTracker Container ✅ CONFIRMED

Container name: `systracker`  
Image: `ghcr.io/redwan002117/systracker:latest`  
Status: Up (healthy) ✅

---

## Part 2 — Collect the Private Key

On your **server terminal**, run:

```bash
cat ~/.ssh/github_deploy_final
```

You'll see:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAA...
...many lines...
-----END OPENSSH PRIVATE KEY-----
```

Select and copy **everything** from `-----BEGIN` to `-----END` (including those lines).

> ⚠️ Copy to clipboard only. Never paste this into chat, a browser, a file in the repo, or anywhere visible to others.

---

## Part 3 — Add GitHub Secrets

Open: **`https://github.com/Redwan002117/SysTracker/settings/secrets/actions`**

Click **New repository secret** for each one below.

> ℹ️ `gh secret set` won't work in this dev container (read-only token). Use the web UI.

### Secrets to Add

| Secret Name | Value | Notes |
|-------------|-------|-------|
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/github_deploy_final` on server | Run `cat ~/.ssh/github_deploy_final` on server, copy entire output |
| `REMOTE_USER` | `rickyadams2117` | Your Linux username |
| `REMOTE_PATH` | `/home/rickyadams2117` | Home directory (for backups) |
| `REMOTE_DASHBOARD_PATH` | `/home/rickyadams2117/server/dashboard-dist` | Where static files are deployed |
| `SERVER_SERVICE` | `systracker` | Docker container name (from `docker ps`) |
| `TELEGRAM_BOT_TOKEN` | Your bot token from `@BotFather` | Revoke old token first if it was exposed |
| `TELEGRAM_CHAT_ID` | `-1003771718059` | Your `@SysTracker` channel ID |

> ✅ `SSH_KNOWN_HOSTS`, `REMOTE_HOST`, and `REMOTE_PORT` are **no longer needed** — the workflow connects through the Cloudflare Tunnel (`ssh.monitor.rico.bd`) with `StrictHostKeyChecking no`.

### 3.1 — Verify Secrets Are Set

After adding all secrets, the page should show:
```
REMOTE_DASHBOARD_PATH
REMOTE_PATH
REMOTE_USER
SERVER_SERVICE
SSH_PRIVATE_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

---

## Part 4 — Configure the GitHub Actions Environment

1. Open this link: `https://github.com/Redwan002117/SysTracker/settings/environments`
2. Click **New environment**
3. Type `production` → click **Configure environment**
4. Click **Save protection rules**

---

## Part 5 — Test SSH via Cloudflare Tunnel

First, install `cloudflared` on your local machine if not already installed:

```bash
# Linux/macOS:
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | \
  sudo gpg --dearmor -o /usr/share/keyrings/cloudflare-main.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
  https://pkg.cloudflare.com/cloudflared any main" | \
  sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared
```

Then test the tunnel connection from your **server terminal** (local network always works):

```bash
ssh -i ~/.ssh/github_deploy_final \
    -o StrictHostKeyChecking=no \
    rickyadams2117@192.168.10.8 \
    "echo 'Connection OK' && whoami"
```

Expected:
```
Connection OK
rickyadams2117
```

To test via Cloudflare Tunnel specifically:
```bash
ssh -i ~/.ssh/github_deploy_final \
    -o ProxyCommand="cloudflared access ssh --hostname ssh.monitor.rico.bd" \
    -o StrictHostKeyChecking=no \
    rickyadams2117@ssh.monitor.rico.bd \
    "echo 'Tunnel OK' && whoami"
```

> If this fails, confirm the Cloudflare Tunnel Path field is empty (not `^/blog`) — see step 1.5.

---

## Part 6 — Test the Telegram Bot

In your **VS Code terminal**, replace `TOKEN` with your actual bot token, then run:

```bash
curl -s "https://api.telegram.org/botTOKEN/sendMessage" \
  -d chat_id="-1003771718059" \
  -d parse_mode="Markdown" \
  -d text="✅ *SysTracker bot test* — connection working\!"
```

You should see `{"ok":true,...}` and a message appear in your `@SysTracker` channel.

---

## Part 7 — Trigger a Deployment

### Option A — Manual trigger (recommended for first test)

1. Open: `https://github.com/Redwan002117/SysTracker/actions/workflows/deploy-dashboard.yml`
2. Click **Run workflow** (grey button, top right)
3. Select environment: `production`
4. Click **Run workflow**

### Option B — Automatic (any push to main)

Any push that changes files in `dashboard/` triggers automatically. To test without real changes:

```bash
# In VS Code terminal:
cd /workspaces/SysTracker
git commit --allow-empty -m "ci: test deployment trigger"
git push origin main
```

---

## Part 8 — Monitor the Deployment

1. Open: `https://github.com/Redwan002117/SysTracker/actions`
2. Click the running workflow (yellow spinner = running, green tick = success, red X = failed)
3. Click any step to see its logs

You'll also receive a Telegram message in `@SysTracker` on success or failure:

**Success:**
```
✅ SysTracker Deploy succeeded

🌿 Branch: `main`
👤 By: `Redwan002117`
📝 `your commit message`
🔗 View Run
```

**Failure:**
```
🚨 SysTracker Deploy FAILED

👤 By: `Redwan002117`
🔗 View Failed Run
```

---

## Part 9 — What the Workflow Does (Step by Step)

| Step | What Happens |
|------|-------------|
| Checkout | Clones the repo |
| Setup Node 22 | Installs Node.js with npm cache |
| Install deps | `npm ci` in `dashboard/` |
| Build | `npm run build` → generates `dashboard/out/` |
| Verify build | Checks `out/` directory exists and reports file count |
| Install cloudflared | Downloads and installs the Cloudflare Tunnel client on the runner |
| Setup SSH | Writes `SSH_PRIVATE_KEY` to `~/.ssh/id_ed25519`, configures `~/.ssh/config` with `ProxyCommand cloudflared access ssh --hostname ssh.monitor.rico.bd` |
| Backup | Archives current `dashboard-dist` via tunnel SSH |
| Deploy | `rsync` uploads `dashboard/out/` → `REMOTE_DASHBOARD_PATH` via tunnel |
| Restart | `docker restart systracker` via tunnel SSH |
| Verify | Reports file count on server via tunnel SSH |
| Telegram | Sends success/fail message to `@SysTracker` channel |
| Rollback | If any step fails → restores latest backup automatically via tunnel SSH |

---

## Part 10 — Troubleshooting

### `Permission denied (publickey)` on SSH

```bash
# On server — confirm PubkeyAuthentication is enabled (no # prefix)
sudo grep "PubkeyAuthentication" /etc/ssh/sshd_config
# Must show: PubkeyAuthentication yes   (not #PubkeyAuthentication yes)

# If still commented, fix and restart:
sudo sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Confirm the public key is in authorized_keys
cat ~/.ssh/authorized_keys | grep -c "ssh-"
# Must return at least 1
```

### Cloudflare Tunnel Not Routing SSH

1. Confirm `big-bear-cloudflared-web` container is running: `docker ps | grep cloudflared`
2. In Cloudflare Zero Trust → Networks → Tunnels → your tunnel → Public Hostnames:
   - Subdomain: `ssh.monitor`, Domain: `rico.bd`
   - Service Type: `SSH`, URL: `192.168.10.8:22`
   - **Path field: must be EMPTY** (clear `^/blog` or any other value)
3. Save and wait ~30 seconds for config to propagate

### Telegram Not Sending

```bash
# Test your token is valid (replace TOKEN):
curl "https://api.telegram.org/botTOKEN/getMe"
# Expected: {"ok":true,"result":{"username":"SysTracker_alartbot",...}}

# Confirm bot is admin in @SysTracker channel:
# Telegram → @SysTracker → Manage → Administrators → SysTracker_alartbot should be listed
```

### Rsync Fails / Permission Denied on Server

```bash
# On server:
ls -la /home/rickyadams2117/server/
chmod 755 /home/rickyadams2117/server/dashboard-dist
```

### CasaOS Container Not Restarting

```bash
# On server — find the exact container name:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"

# Manually restart it (replace name if different):
docker restart systracker
```

Then update the secret with the correct name:
```bash
# In VS Code terminal:
gh secret set SERVER_SERVICE --body "actual-container-name"
```

---

## Summary of All Secrets

Set these at: `https://github.com/Redwan002117/SysTracker/settings/secrets/actions`

| Secret | Value | How to Get It |
|--------|-------|---------------|
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/github_deploy_final` | `cat ~/.ssh/github_deploy_final` on server |
| `REMOTE_USER` | `rickyadams2117` | Your Linux username |
| `REMOTE_PATH` | `/home/rickyadams2117` | Your home directory |
| `REMOTE_DASHBOARD_PATH` | `/home/rickyadams2117/server/dashboard-dist` | Where static files are deployed |
| `SERVER_SERVICE` | `systracker` | `docker ps` container name on server |
| `TELEGRAM_BOT_TOKEN` | Your new bot token | `@BotFather` → `/mybots` → Revoke & get new token |
| `TELEGRAM_CHAT_ID` | `-1003771718059` | Your `@SysTracker` channel ID |

> ❌ **Not needed:** `SSH_KNOWN_HOSTS`, `REMOTE_HOST`, `REMOTE_PORT` — the workflow hardcodes `ssh.monitor.rico.bd` via Cloudflare Tunnel with `StrictHostKeyChecking no`.

