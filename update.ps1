Write-Host "Updating SysTracker Portfolio..." -ForegroundColor Cyan

# 1. Pull latest changes
Write-Host "Pulling latest code..." -ForegroundColor Yellow
git pull
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git pull failed. Please check your internet connection or git status."
    exit 1
}

# 2. Rebuild and restart container
Write-Host "Building and restarting Docker container..." -ForegroundColor Yellow
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Update complete! Portfolio is running at http://localhost:2222" -ForegroundColor Green
} else {
    Write-Error "Docker command failed."
    exit 1
}
