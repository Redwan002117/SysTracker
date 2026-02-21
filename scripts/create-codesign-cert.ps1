# =============================================================================
# SysTracker — Self-Signed Code Signing Certificate Generator
# =============================================================================
# Run this ONCE locally (as Administrator) to create the code signing cert.
#
# What it produces:
#   scripts/SysTracker.cer   — PUBLIC cert  (safe to commit to the repo)
#   SysTracker.pfx           — PRIVATE cert (NEVER commit — add as GitHub Secret)
#
# After running:
#   1. Commit scripts/SysTracker.cer to the repo
#   2. Run: [Convert]::ToBase64String([IO.File]::ReadAllBytes("SysTracker.pfx"))
#      Copy the output → GitHub Repo → Settings → Secrets → CODESIGN_PFX_BASE64
#   3. If you set a PFX password, add it as: CODESIGN_PFX_PASSWORD
#   4. Delete the local SysTracker.pfx (keep it backed up securely)
# =============================================================================

$ErrorActionPreference = "Stop"

$certSubject = "CN=SysTracker, O=Redwan002117, L=Dhaka, C=BD"
$certFriendlyName = "SysTracker Code Signing"
$pfxPath = Join-Path $PSScriptRoot "..\SysTracker.pfx"
$cerPath = Join-Path $PSScriptRoot "SysTracker.cer"
$pfxPassword = Read-Host "Enter a password for the PFX file (can be empty)" -AsSecureString

Write-Host ""
Write-Host "Generating self-signed code signing certificate..." -ForegroundColor Cyan

# Create the cert in the Current User personal store
$cert = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject $certSubject `
    -FriendlyName $certFriendlyName `
    -KeyAlgorithm RSA `
    -KeyLength 4096 `
    -HashAlgorithm SHA256 `
    -NotBefore (Get-Date) `
    -NotAfter (Get-Date).AddYears(10) `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -KeyExportPolicy Exportable `
    -KeySpec Signature `
    -KeyUsage DigitalSignature

Write-Host "  ✓ Certificate created: $($cert.Thumbprint)" -ForegroundColor Green

# Export PFX (private key — keep secret)
$pfxPathResolved = [IO.Path]::GetFullPath($pfxPath)
Export-PfxCertificate -Cert $cert -FilePath $pfxPathResolved -Password $pfxPassword | Out-Null
Write-Host "  ✓ PFX exported: $pfxPathResolved" -ForegroundColor Green
Write-Host "     ⚠ DO NOT commit this file. Keep it backed up securely." -ForegroundColor Yellow

# Export CER (public cert — safe to commit)
$cerPathResolved = [IO.Path]::GetFullPath($cerPath)
Export-Certificate -Cert $cert -FilePath $cerPathResolved -Type CERT | Out-Null
Write-Host "  ✓ CER exported: $cerPathResolved" -ForegroundColor Green
Write-Host "     ✔ This file is safe to commit to the repository." -ForegroundColor Cyan

# Add to local Trusted Publishers and Trusted Root CA so OUR machine trusts it too
$rootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root","LocalMachine")
$rootStore.Open("ReadWrite")
$rootStore.Add($cert)
$rootStore.Close()

$pubStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("TrustedPublisher","LocalMachine")
$pubStore.Open("ReadWrite")
$pubStore.Add($cert)
$pubStore.Close()

Write-Host "  ✓ Cert added to LocalMachine Trusted Root CA and Trusted Publishers" -ForegroundColor Green

# Print the base64 for GitHub Secrets
Write-Host ""
Write-Host "========================================================" -ForegroundColor Magenta
Write-Host " NEXT STEPS" -ForegroundColor Magenta
Write-Host "========================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "1. Commit scripts\SysTracker.cer to the repo:"
Write-Host "     git add scripts/SysTracker.cer && git commit -m 'chore: add code signing public certificate'"
Write-Host ""
Write-Host "2. Copy the base64 below and add it as GitHub Secret: CODESIGN_PFX_BASE64"
Write-Host ""
$pfxBytes = [IO.File]::ReadAllBytes($pfxPathResolved)
$pfxBase64 = [Convert]::ToBase64String($pfxBytes)
Write-Host $pfxBase64 -ForegroundColor DarkGray
Write-Host ""

# If a non-empty password was provided, remind them to add it as a secret
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pfxPassword)
$plainPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
if ($plainPass -ne "") {
    Write-Host "3. Also add your PFX password as GitHub Secret: CODESIGN_PFX_PASSWORD"
    Write-Host ""
}

Write-Host "4. After committing SysTracker.cer, the CI will sign all EXEs automatically."
Write-Host ""
Write-Host "Cert thumbprint: $($cert.Thumbprint)" -ForegroundColor Gray
Write-Host "Valid until:     $($cert.NotAfter.ToString('yyyy-MM-dd'))" -ForegroundColor Gray
Write-Host ""
