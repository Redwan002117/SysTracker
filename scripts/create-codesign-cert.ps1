# =============================================================================
# SysTracker -- Code Signing PKI Generator
# =============================================================================
# Creates a two-tier PKI so Windows UAC shows "Redwan002117" instead of
# "Unknown Publisher":
#
#   [SysTracker Root CA]  <-- trusted root, installed on user machines
#        |__ [SysTracker Code Signing]  <-- signs the EXEs
#
# What it produces:
#   scripts/SysTrackerCA.cer   -- Root CA public cert  (commit to repo)
#   scripts/SysTracker.cer     -- Code signing public cert (commit to repo)
#   SysTrackerCA.pfx           -- Root CA private key  (NEVER commit)
#   SysTracker.pfx             -- Code signing private key (NEVER commit)
#
# After running:
#   1. Commit scripts/SysTrackerCA.cer and scripts/SysTracker.cer
#   2. Add SysTracker.pfx as GitHub Secret CODESIGN_PFX_BASE64 (base64-encoded)
#   3. Add PFX password as CODESIGN_PFX_PASSWORD (if you set one)
#   4. Delete both local .pfx files after backing them up securely
# =============================================================================

$ErrorActionPreference = "Stop"

$publisherName  = "Redwan002117"
$orgUnit        = "SysTracker"
$country        = "BD"
$locality       = "Dhaka"

$caSubject   = "CN=$publisherName Root CA, O=$publisherName, OU=$orgUnit, L=$locality, C=$country"
$codeSubject = "CN=$publisherName, O=$publisherName, OU=$orgUnit, L=$locality, C=$country"

$caPfxPath   = Join-Path $PSScriptRoot "..\SysTrackerCA.pfx"
$caCerPath   = Join-Path $PSScriptRoot "SysTrackerCA.cer"
$pfxPath     = Join-Path $PSScriptRoot "..\SysTracker.pfx"
$cerPath     = Join-Path $PSScriptRoot "SysTracker.cer"

Write-Host ""
Write-Host "SysTracker Code Signing Certificate Generator" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$pfxPassword = Read-Host "Enter a password to protect the PFX files (can be empty)" -AsSecureString
$bstr        = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pfxPassword)
$plainPass   = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)

# -- Step 1: Root CA ----------------------------------------------------------
Write-Host "[1/4] Creating Root CA certificate..." -ForegroundColor Yellow

$rootCert = New-SelfSignedCertificate `
    -Subject $caSubject `
    -FriendlyName "$publisherName Root CA" `
    -KeyAlgorithm RSA `
    -KeyLength 4096 `
    -HashAlgorithm SHA256 `
    -KeyUsage CertSign, CRLSign, DigitalSignature `
    -KeyUsageProperty Sign `
    -NotBefore (Get-Date) `
    -NotAfter (Get-Date).AddYears(15) `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -KeyExportPolicy Exportable `
    -IsCA $true `
    -BasicConstraintsValid $true `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3","2.5.29.19={critical}{text}CA=1")

Write-Host "  OK Root CA:          $($rootCert.Thumbprint)" -ForegroundColor Green

# -- Step 2: Code Signing cert issued by Root CA ------------------------------
Write-Host "[2/4] Issuing code signing cert from Root CA..." -ForegroundColor Yellow

$codeCert = New-SelfSignedCertificate `
    -Subject $codeSubject `
    -FriendlyName "$publisherName Code Signing" `
    -KeyAlgorithm RSA `
    -KeyLength 4096 `
    -HashAlgorithm SHA256 `
    -Type CodeSigningCert `
    -KeyUsage DigitalSignature `
    -KeyUsageProperty Sign `
    -NotBefore (Get-Date) `
    -NotAfter (Get-Date).AddYears(10) `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -KeyExportPolicy Exportable `
    -Signer $rootCert `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3")

Write-Host "  OK Code Signing:     $($codeCert.Thumbprint)" -ForegroundColor Green

# -- Step 3: Export -----------------------------------------------------------
Write-Host "[3/4] Exporting certificates..." -ForegroundColor Yellow

$securePass = if ($plainPass -ne "") {
    ConvertTo-SecureString $plainPass -AsPlainText -Force
} else {
    New-Object System.Security.SecureString
}

$caPfxResolved = [IO.Path]::GetFullPath($caPfxPath)
Export-PfxCertificate -Cert $rootCert -FilePath $caPfxResolved -Password $securePass | Out-Null
Write-Host "  OK Root CA PFX  (private): $caPfxResolved"  -ForegroundColor DarkYellow
Write-Host "     NEVER commit -- keep backed up securely"  -ForegroundColor Red

$caCerResolved = [IO.Path]::GetFullPath($caCerPath)
Export-Certificate -Cert $rootCert -FilePath $caCerResolved -Type CERT | Out-Null
Write-Host "  OK Root CA CER  (public):  $caCerResolved  <-- commit this" -ForegroundColor Green

$pfxResolved = [IO.Path]::GetFullPath($pfxPath)
Export-PfxCertificate -Cert $codeCert -FilePath $pfxResolved -Password $securePass -ChainOption BuildChain | Out-Null
Write-Host "  OK Code Sign PFX (private): $pfxResolved" -ForegroundColor DarkYellow
Write-Host "     NEVER commit -- add as GitHub Secret"    -ForegroundColor Red

$cerResolved = [IO.Path]::GetFullPath($cerPath)
Export-Certificate -Cert $codeCert -FilePath $cerResolved -Type CERT | Out-Null
Write-Host "  OK Code Sign CER (public):  $cerResolved  <-- commit this" -ForegroundColor Green

# -- Step 4: Trust on this machine --------------------------------------------
Write-Host "[4/4] Trusting on this machine..." -ForegroundColor Yellow

foreach ($store in @("Root","TrustedPublisher")) {
    $s = New-Object System.Security.Cryptography.X509Certificates.X509Store($store,"LocalMachine")
    $s.Open("ReadWrite")
    $s.Add($rootCert)
    if ($store -eq "TrustedPublisher") { $s.Add($codeCert) }
    $s.Close()
    Write-Host "  OK LocalMachine\$store" -ForegroundColor Green
}

# -- Next steps ---------------------------------------------------------------
Write-Host ""
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host " NEXT STEPS" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "1. Commit the two public .cer files:"
Write-Host "     git add scripts/SysTrackerCA.cer scripts/SysTracker.cer"
Write-Host "     git commit -m `"chore: add code signing certificates`""
Write-Host ""
Write-Host "2. GitHub Secret  CODESIGN_PFX_BASE64  (copy the line below):"
Write-Host ""
Write-Host ([Convert]::ToBase64String([IO.File]::ReadAllBytes($pfxResolved))) -ForegroundColor DarkGray
Write-Host ""
if ($plainPass -ne "") {
    Write-Host "3. GitHub Secret  CODESIGN_PFX_PASSWORD  =  $plainPass"
    Write-Host ""
}
Write-Host "UAC behaviour after these steps:" -ForegroundColor Cyan
Write-Host "  First install on a new PC  -->  Unknown Publisher (root CA not yet trusted)"
Write-Host "  Installer adds SysTrackerCA.cer to Trusted Root automatically"
Write-Host "  Every SysTracker EXE after that  -->  Verified publisher: $publisherName" -ForegroundColor Green
Write-Host ""
Write-Host "Code signing valid until : $($codeCert.NotAfter.ToString(`"yyyy-MM-dd`"))" -ForegroundColor Gray
Write-Host "Root CA valid until      : $($rootCert.NotAfter.ToString(`"yyyy-MM-dd`"))" -ForegroundColor Gray
