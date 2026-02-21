# SysTracker Windows Container Entrypoint
# Runs SysTracker Server in Windows Docker container

param(
    [string]$Port = "7777"
)

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  SysTracker - Windows Container       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:PORT = $Port
$env:NODE_ENV = "production"

# Create data directory if needed
if (!(Test-Path "/app/data")) {
    New-Item -ItemType Directory -Path "/app/data" -Force | Out-Null
    Write-Host "✓ Data directory created" -ForegroundColor Green
}

# Check .env file
if (!(Test-Path "/app/.env")) {
    Write-Host "Creating .env configuration file..." -ForegroundColor Yellow
    
    $envContent = @"
PORT=$Port
API_KEY=docker_please_change_me_to_something_secure
JWT_EXPIRES_IN=24h

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=false
SMTP_FROM="SysTracker" <noreply@systracker.local>
"@
    
    Set-Content -Path "/app/.env" -Value $envContent -Encoding UTF8
    Write-Host "✓ Created .env (edit for configuration)" -ForegroundColor Green
} else {
    Write-Host "✓ .env configuration found" -ForegroundColor Green
}

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Port: $Port" -ForegroundColor Gray
Write-Host "  Data: /app/data" -ForegroundColor Gray
Write-Host "  Dashboard: http://localhost:$Port" -ForegroundColor Gray
Write-Host ""

Write-Host "Starting SysTracker Server..." -ForegroundColor Yellow
Write-Host ""

# Run Node.js application
& node /app/server.js
