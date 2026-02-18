Write-Host "Updating SysTracker (Dashboard & Server)..." -ForegroundColor Cyan

# 1. Pull latest changes
Write-Host "1. Pulling latest code..." -ForegroundColor Yellow
git pull
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git pull failed."
    exit 1
}

# 2. Update Server
Write-Host "2. Updating Server dependencies..." -ForegroundColor Yellow
cd server
npm install
cd ..

# 3. Update Dashboard
Write-Host "3. Building Dashboard..." -ForegroundColor Yellow
cd dashboard
npm install
npm run build
cd ..

Write-Host "Update complete!" -ForegroundColor Green
Write-Host "Please restart your node server (node server/server.js) to apply changes." -ForegroundColor Gray
