#!/bin/bash
# ============================================================================
# SysTracker Remote Production Deployment Script
# ============================================================================
# Deploys the SysTracker dashboard to a remote production server
#
# Usage:
#   ./scripts/deploy-remote.sh [environment] [options]
#
# Environments:
#   production, staging, demo
#
# Options:
#   --no-build      Skip local build step
#   --dry-run       Show what would be deployed without actually deploying
#   --restart       Restart server after deployment
#
# Prerequisites:
#   - SSH access configured to remote server
#   - rsync installed
#   - Remote server directory structure exists
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
CONFIG_FILE="$(dirname "$0")/deploy-config/${ENVIRONMENT}.conf"

# Parse options
SKIP_BUILD=false
DRY_RUN=false
RESTART_SERVER=false

for arg in "$@"; do
    case $arg in
        --no-build)
            SKIP_BUILD=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --restart)
            RESTART_SERVER=true
            shift
            ;;
    esac
done

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SysTracker Remote Production Deploy     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo

# Check for configuration file
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}✗ Configuration file not found: $CONFIG_FILE${NC}"
    echo
    echo -e "${YELLOW}Creating example configuration...${NC}"
    
    mkdir -p "$(dirname "$0")/deploy-config"
    cat > "$(dirname "$0")/deploy-config/production.conf.example" << 'EOF'
# Production Server Configuration
REMOTE_USER="your-username"
REMOTE_HOST="your-server.com"
REMOTE_PORT="22"
REMOTE_PATH="/var/www/systracker"
REMOTE_SERVER_PATH="/var/www/systracker/server"
REMOTE_DASHBOARD_PATH="/var/www/systracker/server/dashboard-dist"

# Server Management
SERVER_SERVICE="systracker"  # systemd service name
USE_PM2=false               # Set to true if using PM2
PM2_APP_NAME="systracker"   # PM2 app name

# Deployment Options
BACKUP_BEFORE_DEPLOY=true
DEPLOY_ENV_FILE=true        # Deploy .env file
RUN_MIGRATIONS=false        # Run database migrations

# Notification Webhooks (optional)
SLACK_WEBHOOK=""
DISCORD_WEBHOOK=""
EOF
    
    echo -e "${GREEN}✓ Created example config: $(dirname "$0")/deploy-config/production.conf.example${NC}"
    echo -e "${YELLOW}  Please copy and configure it for your environment:${NC}"
    echo -e "  ${PURPLE}cp $(dirname "$0")/deploy-config/production.conf.example $CONFIG_FILE${NC}"
    echo -e "  ${PURPLE}nano $CONFIG_FILE${NC}"
    echo
    exit 1
fi

# Load configuration
echo -e "${BLUE}📝 Loading configuration: $ENVIRONMENT${NC}"
source "$CONFIG_FILE"

# Validate required configuration
if [ -z "$REMOTE_USER" ] || [ -z "$REMOTE_HOST" ] || [ -z "$REMOTE_PATH" ]; then
    echo -e "${RED}✗ Invalid configuration. Required: REMOTE_USER, REMOTE_HOST, REMOTE_PATH${NC}"
    exit 1
fi

echo -e "   Target: ${GREEN}${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}${NC}"
echo

# Check SSH connectivity
echo -e "${BLUE}🔐 Testing SSH connection...${NC}"
if ! ssh -q -o BatchMode=yes -o ConnectTimeout=5 -p "${REMOTE_PORT:-22}" "${REMOTE_USER}@${REMOTE_HOST}" exit; then
    echo -e "${RED}✗ SSH connection failed. Please check:${NC}"
    echo -e "   - SSH key is configured"
    echo -e "   - Remote host is accessible"
    echo -e "   - User and host are correct"
    exit 1
fi
echo -e "${GREEN}✓ SSH connection successful${NC}"
echo

# Build dashboard if not skipped
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${BLUE}🔨 Building dashboard...${NC}"
    cd dashboard
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}   Installing dependencies...${NC}"
        npm install --prefer-offline --no-audit
    fi
    
    echo -e "${YELLOW}   Running build...${NC}"
    npm run build
    
    if [ ! -d "out" ]; then
        echo -e "${RED}✗ Build failed - output directory not found${NC}"
        exit 1
    fi
    
    cd ..
    echo -e "${GREEN}✓ Dashboard built successfully${NC}"
    echo -e "   Files: $(find dashboard/out -type f | wc -l)"
    echo -e "   Size:  $(du -sh dashboard/out | cut -f1)"
    echo
else
    echo -e "${YELLOW}⏭  Skipping build (--no-build)${NC}"
    echo
fi

# Backup existing deployment
if [ "$BACKUP_BEFORE_DEPLOY" = true ] && [ "$DRY_RUN" = false ]; then
    echo -e "${BLUE}💾 Creating backup on remote server...${NC}"
    BACKUP_NAME="dashboard-backup-$(date +%Y%m%d-%H%M%S)"
    ssh -p "${REMOTE_PORT:-22}" "${REMOTE_USER}@${REMOTE_HOST}" \
        "cd ${REMOTE_PATH} && [ -d server/dashboard-dist ] && tar -czf ${BACKUP_NAME}.tar.gz server/dashboard-dist || echo 'No existing deployment to backup'"
    echo -e "${GREEN}✓ Backup created: ${BACKUP_NAME}.tar.gz${NC}"
    echo
fi

# Deploy dashboard
echo -e "${BLUE}🚀 Deploying dashboard to production...${NC}"

RSYNC_OPTS="-avz --delete"
if [ "$DRY_RUN" = true ]; then
    RSYNC_OPTS="$RSYNC_OPTS --dry-run"
    echo -e "${YELLOW}   DRY RUN MODE - No changes will be made${NC}"
fi

rsync $RSYNC_OPTS \
    -e "ssh -p ${REMOTE_PORT:-22}" \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    dashboard/out/ \
    "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DASHBOARD_PATH}/"

if [ "$DRY_RUN" = false ]; then
    echo -e "${GREEN}✓ Dashboard deployed successfully${NC}"
else
    echo -e "${YELLOW}✓ Dry run completed${NC}"
fi
echo

# Deploy server files if needed (optional)
if [ "$DEPLOY_SERVER_FILES" = true ] && [ "$DRY_RUN" = false ]; then
    echo -e "${BLUE}📦 Deploying server files...${NC}"
    
    rsync -avz \
        -e "ssh -p ${REMOTE_PORT:-22}" \
        --exclude 'node_modules' \
        --exclude 'dashboard-dist' \
        --exclude 'systracker.db' \
        --exclude 'logs' \
        --exclude '.env' \
        server/ \
        "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_SERVER_PATH}/"
    
    echo -e "${GREEN}✓ Server files deployed${NC}"
    echo
fi

# Deploy environment file if specified
if [ "$DEPLOY_ENV_FILE" = true ] && [ -f ".env.production" ] && [ "$DRY_RUN" = false ]; then
    echo -e "${BLUE}⚙️  Deploying environment configuration...${NC}"
    scp -P "${REMOTE_PORT:-22}" .env.production "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_SERVER_PATH}/.env"
    echo -e "${GREEN}✓ Environment file deployed${NC}"
    echo
fi

# Run database migrations if needed
if [ "$RUN_MIGRATIONS" = true ] && [ "$DRY_RUN" = false ]; then
    echo -e "${BLUE}🗄️  Running database migrations...${NC}"
    ssh -p "${REMOTE_PORT:-22}" "${REMOTE_USER}@${REMOTE_HOST}" \
        "cd ${REMOTE_SERVER_PATH} && npm run migrate"
    echo -e "${GREEN}✓ Migrations completed${NC}"
    echo
fi

# Restart server
if [ "$RESTART_SERVER" = true ] && [ "$DRY_RUN" = false ]; then
    echo -e "${BLUE}🔄 Restarting server...${NC}"
    
    if [ "$USE_PM2" = true ]; then
        ssh -p "${REMOTE_PORT:-22}" "${REMOTE_USER}@${REMOTE_HOST}" \
            "pm2 restart ${PM2_APP_NAME}"
        echo -e "${GREEN}✓ Server restarted (PM2: ${PM2_APP_NAME})${NC}"
    elif [ -n "$SERVER_SERVICE" ]; then
        ssh -p "${REMOTE_PORT:-22}" "${REMOTE_USER}@${REMOTE_HOST}" \
            "sudo systemctl restart ${SERVER_SERVICE}"
        echo -e "${GREEN}✓ Server restarted (systemd: ${SERVER_SERVICE})${NC}"
    else
        echo -e "${YELLOW}⚠  No restart method configured${NC}"
    fi
    echo
fi

# Verification
if [ "$DRY_RUN" = false ]; then
    echo -e "${BLUE}✅ Verifying deployment...${NC}"
    FILE_COUNT=$(ssh -p "${REMOTE_PORT:-22}" "${REMOTE_USER}@${REMOTE_HOST}" \
        "find ${REMOTE_DASHBOARD_PATH} -type f | wc -l")
    DIR_SIZE=$(ssh -p "${REMOTE_PORT:-22}" "${REMOTE_USER}@${REMOTE_HOST}" \
        "du -sh ${REMOTE_DASHBOARD_PATH} | cut -f1")
    
    echo -e "   Files deployed: ${GREEN}${FILE_COUNT}${NC}"
    echo -e "   Directory size: ${GREEN}${DIR_SIZE}${NC}"
    echo
fi

# Send notifications
if [ -n "$SLACK_WEBHOOK" ] && [ "$DRY_RUN" = false ]; then
    curl -X POST "$SLACK_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"🚀 SysTracker deployed to ${ENVIRONMENT} by $(whoami)\"}" \
        > /dev/null 2>&1 || true
fi

if [ -n "$DISCORD_WEBHOOK" ] && [ "$DRY_RUN" = false ]; then
    curl -X POST "$DISCORD_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d "{\"content\":\"🚀 SysTracker deployed to ${ENVIRONMENT} by $(whoami)\"}" \
        > /dev/null 2>&1 || true
fi

# Summary
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✓ Deployment Successful!             ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo
echo -e "${BLUE}🌐 Access your deployment:${NC}"
echo -e "   ${PURPLE}ssh ${REMOTE_USER}@${REMOTE_HOST}${NC}"
echo -e "   ${PURPLE}https://${REMOTE_HOST}${NC}"
echo
echo -e "${BLUE}📊 Deployment completed at: $(date)${NC}"
echo
