#!/bin/bash

# Configuration
LOG_FILE="systracker_update.log"
CONTAINER_NAME="systracker-admin"
IMAGE_NAME="ghcr.io/redwan002117/systracker:latest"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging Function
log() {
    echo -e "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

info() {
    log "${BLUE}[INFO]${NC} $1"
}

success() {
    log "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    log "${RED}[ERROR]${NC} $1"
}

warn() {
    log "${YELLOW}[WARNING]${NC} $1"
}

# Header
clear
echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}      SysTracker - Smart Update System    ${NC}"
echo -e "${BLUE}==========================================${NC}"
echo "Log file: $LOG_FILE"
echo ""

# 0. Self-Update Check
info "Checking for update script upgrades..."
# Add timestamp to bypass cache
REMOTE_URL="https://raw.githubusercontent.com/Redwan002117/SysTracker/main/update_app.sh?t=$(date +%s)"
TEMP_SCRIPT="/tmp/update_app_systracker.sh"

if command -v wget &> /dev/null; then
    wget -q -O "$TEMP_SCRIPT" "$REMOTE_URL"
    if [ -s "$TEMP_SCRIPT" ]; then
        # Compare checksums if possible, or just size/diff
        if ! cmp -s "update_app.sh" "$TEMP_SCRIPT"; then
            # Verify it's a valid script header before replacing
            if head -n 1 "$TEMP_SCRIPT" | grep -q "#!/bin/bash"; then
                warn "New version of update_app.sh detected. Update initiated."
                mv "$TEMP_SCRIPT" "update_app.sh"
                chmod +x "update_app.sh"
                success "Script updated successfully. Reloading..."
                exec ./update_app.sh
            fi
        else
            info "Update script is already latest."
            rm -f "$TEMP_SCRIPT"
        fi
    else
        warn "Failed to download update script check."
    fi
else
    warn "Wget not found. Skipping self-update check."
fi
echo ""

# 1. Pre-flight Checks
info "Starting pre-flight checks..."

# Check Docker
if ! command -v docker &> /dev/null; then
    error "Docker is not installed or not in PATH."
    exit 1
fi

# Check Docker Service
if ! docker info &> /dev/null; then
    error "Docker daemon is not running. Please start Docker."
    exit 1
fi

# Check Permissions
if [ ! -w . ]; then
    warn "Current directory is not writable. Logging might fail."
fi

# Check docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    error "docker-compose.yml not found in $(pwd)"
    exit 1
fi

success "System checks passed."
echo ""

# 2. Backup / Diagnostics Pre-Update
info "Capturing state before update..."
if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
    docker logs --tail 20 $CONTAINER_NAME > "pre_update_logs.txt" 2>&1
    success "Saved pre-update logs to 'pre_update_logs.txt'."
else
    warn "Container '$CONTAINER_NAME' is not currently running (skipping log backup)."
fi
echo ""

# 2. Check for Updates
info "Checking for application updates..."

CHANGELOG_URL="https://raw.githubusercontent.com/Redwan002117/SysTracker/main/CHANGELOG.md?t=$(date +%s)"
VERSION_FILE="version.txt"
CURRENT_VERSION="Unknown"

[[ -f "$VERSION_FILE" ]] && CURRENT_VERSION=$(cat "$VERSION_FILE")

# Fetch latest changelog preview
echo -e "${CYAN}--- WHAT'S NEW ---${NC}"
FORCE_UPDATE="n"

if command -v curl &> /dev/null; then
    CONTENT=$(curl -s "$CHANGELOG_URL")
    
    # Extract Latest Version
    LATEST_VERSION=$(echo "$CONTENT" | grep -o "\[v[0-9]*\.[0-9]*\.[0-9]*\]" | head -n 1)
    
    echo -e "Current Version:        ${YELLOW}$CURRENT_VERSION${NC}"
    echo -e "Latest Version (Cloud): ${GREEN}$LATEST_VERSION${NC}"
    echo ""
    
    if [[ "$CURRENT_VERSION" == "$LATEST_VERSION" ]]; then
        echo -e "${GREEN}✅ Version numbers match. Verifying image integrity...${NC}"
        
        # Capture current image ID
        CURRENT_IMAGE_ID=$(docker images -q $IMAGE_NAME)
        
        # Pull latest
        info "Checking remote registry for layer changes..."
        docker compose pull -q
        
        # Capture new image ID
        NEW_IMAGE_ID=$(docker images -q $IMAGE_NAME)
        
        if [[ "$CURRENT_IMAGE_ID" == "$NEW_IMAGE_ID" ]]; then
            success "Images are bit-for-bit identical."
            info "No restart required. Exiting."
            exit 0
        else
            warn "Deep Hash Mismatch: Remote image has changed (rebuilt). Updating..."
            FORCE_UPDATE="y"
        fi
    else
        echo -e "${YELLOW}⚠️  Update Available! (Auto-starting update...)${NC}"
        echo "$CONTENT" | grep -A 10 "## \[" | head -n 10
        echo -e "${CYAN}------------------${NC}"
        
        # Auto-proceed
        echo "Proceeding with update in 3 seconds..."
        sleep 3
    fi
else
    echo "Curl not found, skipping preview."
fi

# 3. Pull Updates
info "Pulling latest images from GHCR..."

docker compose pull
# Check exit code
if [ $? -eq 0 ]; then
    success "Images downloaded successfully."
    # Update local version file
    if [[ -n "$LATEST_VERSION" ]]; then
        echo "$LATEST_VERSION" > "$VERSION_FILE"
    fi
else
    error "Failed to pull images."
    echo "Diagnostic Checklist:"
    echo " - Check internet connection"
    echo " - Verify image name in docker-compose.yml"
    exit 1
fi
echo ""

# 4. Restart Application
info "Applying updates (Forcing container restart)..."
if docker compose up -d --force-recreate --remove-orphans; then
    success "Container restart command sent."
else
    error "Failed to restart container."
    exit 1
fi

# 5. Health Check
echo -e "${YELLOW}Waiting 10 seconds for container initialization...${NC}"
sleep 10

info "Running health check..."
# Check if container is running
if docker ps -f name=$CONTAINER_NAME -f status=running | grep -q $CONTAINER_NAME; then
    success "Container '$CONTAINER_NAME' is UP."
    
    # Optional: Check logs for errors
    if docker logs --tail 10 $CONTAINER_NAME 2>&1 | grep -iE "error|exception|fail"; then
        warn "Potential issues detected in recent logs:"
        docker logs --tail 10 $CONTAINER_NAME
        echo ""
    else
        success "No immediate errors found in logs."
    fi
else
    error "Container '$CONTAINER_NAME' failed to start."
    echo "---------------- DEBUG LOGS ----------------"
    docker logs --tail 50 $CONTAINER_NAME
    echo "--------------------------------------------"
    exit 1
fi
echo ""

# 6. Deployment Summary
echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}           DEPLOYMENT SUMMARY             ${NC}"
echo -e "${CYAN}==========================================${NC}"
CONTAINER_ID=$(docker ps --filter "name=$CONTAINER_NAME" --format "{{.ID}}")
REAL_IMAGE_NAME=$(docker ps --filter "name=$CONTAINER_NAME" --format "{{.Image}}")

echo "Container:   $CONTAINER_NAME"
echo "Status:      $(docker ps --filter "name=$CONTAINER_NAME" --format "{{.Status}}")"
echo "Image:       $REAL_IMAGE_NAME"
echo "Disk Usage:  $(docker ps --filter "name=$CONTAINER_NAME" --size --format "{{.Size}}")"
echo "Ports:       $(docker ps --filter "name=$CONTAINER_NAME" --format "{{.Ports}}")"
echo -e "${CYAN}------------------------------------------${NC}"
echo "Mounts:"
docker inspect --format '{{range .Mounts}} - {{.Source}} -> {{.Destination}} ({{.Type}}){{println}}{{end}}' $CONTAINER_ID
echo -e "${CYAN}==========================================${NC}"
echo "Access URL:  http://localhost:7777"
exit 0
