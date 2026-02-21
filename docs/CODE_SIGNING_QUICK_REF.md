# Code Signing Quick Reference

## 🚀 Quick Setup (5 minutes)

### On Windows Machine:

```powershell
# 1. Generate certificates
cd C:\path\to\SysTracker
.\scripts\create-codesign-cert.ps1

# 2. Commit public certificates
git add scripts/SysTrackerCA.cer scripts/SysTracker.cer
git commit -m "chore: add code signing certificates"
git push

# 3. The script outputs base64 strings - copy them to GitHub Secrets
```

### GitHub Secrets to Add:

Go to: `https://github.com/Redwan002117/SysTracker/settings/secrets/actions`

| Secret Name | Value | Required |
|-------------|-------|----------|
| `CODESIGN_PFX_BASE64` | Base64-encoded PFX (from script output #1) | ✅ Yes |
| `CODESIGN_CA_BASE64` | Base64-encoded CA cert (from script output #2) | ⚠️ Recommended |
| `CODESIGN_PFX_PASSWORD` | Password you entered (if any) | ⚠️ If password set |

### Test It:

```bash
# Create a test release
git tag -a v3.2.7-test -m "Test code signing"
git push origin v3.2.7-test

# Watch the build
gh run watch
```

Look for: ✓ Sign Windows Executables

---

## 📝 Manual GitHub Secrets Setup

### Method 1: GitHub Web UI

1. Open: https://github.com/Redwan002117/SysTracker/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `CODESIGN_PFX_BASE64`
4. Value: Paste the **entire** base64 string (it's very long, ~4000 chars)
5. Click **"Add secret"**
6. Repeat for `CODESIGN_CA_BASE64` and `CODESIGN_PFX_PASSWORD` (if needed)

### Method 2: GitHub CLI

```bash
# Set the PFX certificate (replace with your actual base64 string)
gh secret set CODESIGN_PFX_BASE64 --body "MIIJ..." --repo Redwan002117/SysTracker

# Set the CA certificate
gh secret set CODESIGN_CA_BASE64 --body "MIIE..." --repo Redwan002117/SysTracker

# Set the password (if you used one)
gh secret set CODESIGN_PFX_PASSWORD --body "your-password" --repo Redwan002117/SysTracker
```

### Method 3: From File

```bash
# If you have the base64 values in files
gh secret set CODESIGN_PFX_BASE64 < pfx_base64.txt --repo Redwan002117/SysTracker
gh secret set CODESIGN_CA_BASE64 < ca_base64.txt --repo Redwan002117/SysTracker
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Public `.cer` files are committed to `scripts/` folder
- [ ] Private `.pfx` files are **NOT** in git (check `.gitignore`)
- [ ] GitHub Secrets are set (check Settings → Secrets → Actions)
- [ ] Test release builds successfully
- [ ] "Sign Windows Executables" step shows ✅ in CI logs
- [ ] Downloaded `.exe` shows "SysTracker" in Properties → Digital Signatures

---

## 🔐 Security Best Practices

✅ **DO:**
- Use a strong password for PFX files
- Backup PFX files to encrypted storage
- Delete local PFX files after adding to GitHub
- Rotate certificates before they expire (10 years)
- Keep GitHub secrets permissions restricted

❌ **DON'T:**
- Commit `.pfx` files to git
- Share PFX password in plain text
- Store PFX files in cloud storage unencrypted
- Use the same certificate for multiple projects
- Reuse compromised certificates

---

## 🆘 Troubleshooting

### Issue: "Code signing certificate not configured, skipping..."

**Cause:** GitHub secret not set.

**Fix:** Add `CODESIGN_PFX_BASE64` secret.

### Issue: "Certificate not found for subject 'CN=SysTracker'"

**Cause:** PFX doesn't contain the expected certificate.

**Fix:** Re-run `create-codesign-cert.ps1` and update the secret.

### Issue: Executables still show "Unknown Publisher"

**Cause:** Root CA not trusted on user's machine.

**Fix:** Installer automatically installs the CA cert. For manual installs, run:
```powershell
certutil -addstore -f "Root" scripts\SysTrackerCA.cer
```

### Issue: "The specified timestamp server could not be reached"

**Cause:** Network issue or DigiCert server down.

**Fix:** Retry the workflow. Timestamps are not critical but recommended.

---

## 📚 Learn More

Full documentation: [CODE_SIGNING_SETUP.md](CODE_SIGNING_SETUP.md)

Script location: [scripts/create-codesign-cert.ps1](../scripts/create-codesign-cert.ps1)

Workflow: [.github/workflows/publish.yml](../.github/workflows/publish.yml)
