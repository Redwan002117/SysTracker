# SysTracker — SSH Deployment & Telegram Notifications Setup Guide

> **Server:** `monitor.rico.bd` — Ubuntu 25.10, CasaOS, hostname `RickyAdams2117`, user `rickyadams2117`
>
> **"Dev container terminal"** means the **terminal inside VS Code** (the editor where you're reading this file). It's the black terminal panel at the bottom of VS Code — NOT your server terminal. When the guide says "run in dev container terminal", open a terminal in VS Code (`Ctrl+` `` ` ``) and run it there.

---

## Prerequisites

- SSH access to `monitor.rico.bd` as `rickyadams2117`
- GitHub CLI (`gh`) authenticated — verify with `gh auth status` **in VS Code terminal**
- Telegram bot already created via `@BotFather`

---

## Part 0 — Revoke Exposed Keys ✅ DONE

> ✅ Already completed. Old keys removed, `github_deploy_new` is in place with correct permissions.

**Verified state:**
- `~/.ssh/github_deploy` — deleted ✅
- `~/.ssh/github_deploy_new` — safe key, permissions `600` ✅
- `~/.ssh/github_deploy_new.pub` — in `authorized_keys` ✅
- `.ssh/` directory — permissions `700` ✅
- Home directory — permissions `755` ✅

---

## Part 1 — Server Setup (on `monitor.rico.bd`)

### 1.1 — Generate a Dedicated Deploy SSH Key ✅ DONE

Already done. Key is at `~/.ssh/github_deploy_new`.

### 1.2 — Authorize the Key on the Server ✅ DONE

Already done. Public key is in `~/.ssh/authorized_keys`.

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

### 1.5 — Find the SSH Port

```bash
sudo ss -tlnp | grep sshd
```

Note the port number (default is `22`). You'll need this for secrets.

### 1.6 — CasaOS SysTracker Container ✅ CONFIRMED

Container name: `systracker`  
Image: `ghcr.io/redwan002117/systracker:latest`  
Status: Up (healthy) ✅

---

## Part 2 — Collect the Private Key

On your **server terminal**, run:

```bash
cat ~/.ssh/github_deploy_new
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

Open the **VS Code terminal** (`Ctrl+` `` ` `` in VS Code). Run each command below. For commands that ask for input, paste the value and press `Enter` then `Ctrl+D`.

### 3.1 — SSH Private Key

```bash
gh secret set SSH_PRIVATE_KEY
```

→ Paste the private key you copied in Part 2 → `Enter` → `Ctrl+D`

### 3.2 — SSH Known Hosts

```bash
ssh-keyscan -H monitor.rico.bd | gh secret set SSH_KNOWN_HOSTS
```

→ Runs automatically, no paste needed.

### 3.3 — Server Connection

```bash
gh secret set REMOTE_HOST --body "monitor.rico.bd"
gh secret set REMOTE_USER --body "rickyadams2117"
gh secret set REMOTE_PORT --body "22"
```

> Replace `22` if your SSH port is different (check from step 1.5).

### 3.4 — Server Paths

```bash
gh secret set REMOTE_PATH --body "/home/rickyadams2117"
gh secret set REMOTE_DASHBOARD_PATH --body "/home/rickyadams2117/server/dashboard-dist"
```

### 3.5 — CasaOS Docker Container Name

Find your SysTracker container name (from step 1.6), then:

```bash
# Replace "systracker" with the actual container name if different
gh secret set SERVER_SERVICE --body "systracker"
```

### 3.6 — Telegram

```bash
gh secret set TELEGRAM_BOT_TOKEN
```

→ Paste your bot token from `@BotFather` → `Enter` → `Ctrl+D`

```bash
gh secret set TELEGRAM_CHAT_ID --body "-1003771718059"
```

### 3.7 — Verify All Secrets Are Set

```bash
gh secret list
```

Expected output:
```
NAME                    UPDATED
REMOTE_DASHBOARD_PATH   about now
REMOTE_HOST             about now
REMOTE_PATH             about now
REMOTE_PORT             about now
REMOTE_USER             about now
SERVER_SERVICE          about now
SSH_KNOWN_HOSTS         about now
SSH_PRIVATE_KEY         about now
TELEGRAM_BOT_TOKEN      about now
TELEGRAM_CHAT_ID        about now
```

---

## Part 4 — Configure the GitHub Actions Environment

1. Open this link: `https://github.com/Redwan002117/SysTracker/settings/environments`
2. Click **New environment**
3. Type `production` → click **Configure environment**
4. Click **Save protection rules**

---

## Part 5 — Test SSH Connection

In your **VS Code terminal**, run:

```bash
ssh -i ~/.ssh/github_deploy_new \
    -o StrictHostKeyChecking=no \
    rickyadams2117@monitor.rico.bd \
    "echo 'Connection OK' && whoami"
```

> Note: This test uses the key on your local machine from when you SSHed in earlier. GitHub Actions uses the same key from the secret.

Expected:
```
Connection OK
rickyadams2117
```

If it fails with `Permission denied (publickey)`, go back to step 1.4 and confirm `PubkeyAuthentication yes` is uncommented and SSH was restarted.

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
| Setup SSH | Loads `SSH_PRIVATE_KEY` + `SSH_KNOWN_HOSTS` from secrets |
| Backup | Archives current `dashboard-dist` on server (keeps last 5) |
| Deploy | `rsync` uploads `dashboard/out/` → `REMOTE_DASHBOARD_PATH` |
| Restart | `docker restart <container>` or `systemctl restart` |
| Verify | Reports file count on server |
| Telegram | Sends success/fail message to `@SysTracker` channel |
| Rollback | If any step fails → restores latest backup automatically |

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
grep "github-actions-systracker" ~/.ssh/authorized_keys
# Must return exactly one line
```

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

| Secret | Value to Use | How to Get It |
|--------|-------------|---------------|
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/github_deploy_new` | `cat ~/.ssh/github_deploy_new` on server |
| `SSH_KNOWN_HOSTS` | Server fingerprint | `ssh-keyscan monitor.rico.bd` in VS Code terminal |
| `REMOTE_HOST` | `monitor.rico.bd` | Your domain |
| `REMOTE_USER` | `rickyadams2117` | Your Linux username |
| `REMOTE_PORT` | `22` | `ss -tlnp \| grep sshd` on server |
| `REMOTE_PATH` | `/home/rickyadams2117` | Your home directory |
| `REMOTE_DASHBOARD_PATH` | `/home/rickyadams2117/server/dashboard-dist` | Where to deploy static files |
| `SERVER_SERVICE` | `systracker` | `docker ps` container name on server |
| `TELEGRAM_BOT_TOKEN` | `123456789:AAF...` | `@BotFather` → `/mybots` → API Token |
| `TELEGRAM_CHAT_ID` | `-1003771718059` | Your `@SysTracker` channel ID |

