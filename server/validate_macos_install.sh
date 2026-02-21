#!/bin/bash

# SysTracker macOS Installation Validation Test
# Usage: ./validate_macos_install.sh [service-name] [port] [install-dir]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="${1:-systracker}"
PORT="${2:-7777}"
INSTALL_DIR="${3:-$(pwd)}"

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
test_pass() {
    local message="$1"
    local details="${2:-}"
    echo -e "  ${GREEN}✓ PASS${NC}  $message"
    if [ -n "$details" ]; then
        echo -e "         ${GRAY}$details${NC}"
    fi
    ((TESTS_PASSED++))
}

test_fail() {
    local message="$1"
    local details="${2:-}"
    echo -e "  ${RED}✗ FAIL${NC}  $message"
    if [ -n "$details" ]; then
        echo -e "         ${GRAY}$details${NC}"
    fi
    ((TESTS_FAILED++))
}

test_warn() {
    local message="$1"
    echo -e "  ${YELLOW}⚠ INFO${NC}  $message"
}

# ============================================================================
# TESTS
# ============================================================================

header() {
    echo ""
    echo -e "${BLUE}$1${NC}"
}

show_intro() {
    echo ""
    echo -e "${BLUE}╔═════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  SysTracker - macOS Installation Tests  ║${NC}"
    echo -e "${BLUE}╚═════════════════════════════════════════╝${NC}"
    echo -e "${GRAY}Service Name: $SERVICE_NAME${NC}"
    echo -e "${GRAY}Port: $PORT${NC}"
    echo -e "${GRAY}Installation: $INSTALL_DIR${NC}"
    echo -e "${GRAY}macOS Version: $(sw_vers -productVersion)${NC}"
}

test_user_privileges() {
    header "1. USER PRIVILEGES"
    
    if [ "$EUID" -eq 0 ]; then
        test_pass "Running with root privileges"
    else
        test_warn "Not running as root (launchd installation may require sudo)"
    fi
}

test_node_installed() {
    header "2. NODE.JS INSTALLATION"
    
    if command -v node &>/dev/null; then
        local version=$(node -v)
        test_pass "Node.js installed" "Version: $version"
    else
        test_fail "Node.js installed" "Node.js not found in PATH"
    fi
}

test_npm_installed() {
    header "3. NPM INSTALLATION"
    
    if command -v npm &>/dev/null; then
        local version=$(npm -v)
        test_pass "npm installed" "Version: $version"
    else
        test_fail "npm installed" "npm not found in PATH"
    fi
}

test_homebrew() {
    header "4. HOMEBREW INSTALLATION"
    
    if command -v brew &>/dev/null; then
        local version=$(brew -v | head -1)
        test_pass "Homebrew installed" "$version"
    else
        test_warn "Homebrew not installed (optional for macOS)"
    fi
}

test_port_available() {
    header "5. PORT AVAILABILITY"
    
    if lsof -i :$PORT >/dev/null 2>&1; then
        test_pass "Port $PORT in use"
    else
        test_fail "Port $PORT in use"
    fi
}

test_application_running() {
    header "6. APPLICATION PROCESS"
    
    if pgrep -f "server.js" >/dev/null 2>&1; then
        local memory=$(ps aux | grep 'server.js' | grep -v grep | awk '{print $6}')
        test_pass "Application process running" "Memory: ${memory}K"
    elif command -v docker &>/dev/null && docker ps 2>/dev/null | grep systracker >/dev/null; then
        test_pass "Docker container running"
    else
        test_fail "Application process running"
    fi
}

test_launchd_service() {
    header "7. LAUNCHD SERVICE"
    
    local launchd_plist="$HOME/Library/LaunchAgents/com.$SERVICE_NAME.plist"
    
    if [ -f "$launchd_plist" ]; then
        test_pass "Launchd plist exists"
        
        # Check if loaded
        if launchctl list | grep -q "$SERVICE_NAME"; then
            test_pass "Launchd service loaded"
        else
            test_warn "Launchd service exists but not loaded"
        fi
    else
        test_warn "Launchd service not installed at $launchd_plist"
    fi
}

test_database() {
    header "8. DATABASE"
    
    local db_path="$INSTALL_DIR/data/systracker.db"
    
    if [ -f "$db_path" ]; then
        local size=$(du -h "$db_path" | awk '{print $1}')
        test_pass "Database file exists" "Size: $size"
    else
        test_fail "Database file exists" "Not found at $db_path"
    fi
}

test_configuration() {
    header "9. CONFIGURATION"
    
    local env_path="$INSTALL_DIR/.env"
    
    if [ -f "$env_path" ]; then
        if grep -q "PORT=$PORT" "$env_path" 2>/dev/null; then
            test_pass "Configuration file (.env) exists with correct port"
        else
            test_pass "Configuration file (.env) exists"
        fi
    else
        test_fail "Configuration file (.env) exists"
    fi
}

test_dashboard() {
    header "10. DASHBOARD CONNECTIVITY"
    
    if command -v curl &>/dev/null; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null)
        if [ "$response" = "200" ] || [ "$response" = "302" ]; then
            test_pass "Dashboard accessible" "HTTP $response"
        else
            test_fail "Dashboard accessible" "HTTP $response"
        fi
    else
        test_warn "curl not available for connectivity test"
    fi
}

test_api() {
    header "11. API ENDPOINT"
    
    if command -v curl &>/dev/null; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/auth/status" 2>/dev/null)
        if [ "$response" = "200" ]; then
            test_pass "API responding" "HTTP $response"
        else
            test_fail "API responding" "HTTP $response"
        fi
    else
        test_warn "curl not available for API test"
    fi
}

test_logs() {
    header "12. LOGS"
    
    local log_path="$INSTALL_DIR/logs/app.log"
    
    if [ -f "$log_path" ]; then
        local lines=$(wc -l < "$log_path")
        test_pass "Log file exists" "Size: $lines lines"
    else
        test_warn "Log file not yet created"
    fi
}

test_directory_structure() {
    header "13. DIRECTORY STRUCTURE"
    
    local dirs=("data" "logs" "uploads")
    
    for dir in "${dirs[@]}"; do
        if [ -d "$INSTALL_DIR/$dir" ]; then
            test_pass "Directory: $dir"
        else
            test_fail "Directory: $dir"
        fi
    done
}

test_permissions() {
    header "14. FILE PERMISSIONS"
    
    if [ -w "$INSTALL_DIR/data" ]; then
        test_pass "Write permission on data directory"
    else
        test_fail "Write permission on data directory"
    fi
}

test_docker() {
    header "15. DOCKER SUPPORT"
    
    if command -v docker &>/dev/null; then
        local version=$(docker --version)
        test_pass "Docker installed" "$version"
        
        if docker ps 2>/dev/null | grep -q systracker; then
            test_pass "Docker container running"
        else
            test_warn "Docker installed but container not running"
        fi
    else
        test_warn "Docker not installed (optional)"
    fi
}

test_xcode() {
    header "16. DEVELOPER TOOLS"
    
    if command -v xcode-select &>/dev/null && [ -d "$(xcode-select -p)" ]; then
        test_pass "Xcode Command Line Tools installed"
    else
        test_warn "Xcode Command Line Tools may be needed for some npm packages"
    fi
}

test_memory() {
    header "17. SYSTEM RESOURCES"
    
    local available_mem=$(vm_stat | grep "Pages free" | awk '{print ($3/256)}' | cut -d. -f1)
    local app_mem=$(ps aux | grep 'server.js' | grep -v grep | awk '{print $6}' | awk '{sum+=$1} END {print sum}')
    
    if [ -n "$app_mem" ]; then
        if [ "$app_mem" -lt 1000000 ]; then
            test_pass "Application memory usage normal" "Memory: ${app_mem}K"
        else
            test_fail "Application memory usage high" "Memory: ${app_mem}K (>1GB)"
        fi
    fi
    
    echo -e "  ${GRAY}Available RAM: ${available_mem}MB${NC}"
}

show_summary() {
    echo ""
    echo -e "${BLUE}═════════════════════════════════════════${NC}"
    echo -e "${BLUE}VALIDATION SUMMARY${NC}"
    echo -e "${BLUE}═════════════════════════════════════════${NC}"
    
    local percentage=0
    if [ $TESTS_TOTAL -gt 0 ]; then
        percentage=$(( (TESTS_PASSED * 100) / TESTS_TOTAL ))
    fi
    
    echo "Passed: $TESTS_PASSED / $TESTS_TOTAL tests ($percentage%)"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ ALL TESTS PASSED - Installation is working correctly!${NC}"
    elif [ $percentage -ge 80 ]; then
        echo -e "${YELLOW}⚠ MOST TESTS PASSED - Installation working with minor issues${NC}"
    else
        echo -e "${RED}✗ TESTS FAILED - Installation has problems${NC}"
    fi
}

show_next_steps() {
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "  1. Open browser: http://localhost:$PORT"
    echo -e "  2. Create admin account in Setup wizard"
    echo -e "  3. Configure API key in Settings"
    echo -e "  4. Download and install agent on test machine"
    echo ""
    echo -e "${BLUE}Service Management:${NC}"
    echo -e "  Start:   launchctl start com.$SERVICE_NAME"
    echo -e "  Stop:    launchctl stop com.$SERVICE_NAME"
    echo -e "  Logs:    log show --predicate 'process contains \"$SERVICE_NAME\"' --level debug"
    echo ""
}

# ============================================================================
# MAIN
# ============================================================================

show_intro
test_user_privileges
test_node_installed
test_npm_installed
test_homebrew
test_port_available
test_application_running
test_launchd_service
test_database
test_configuration
test_dashboard
test_api
test_logs
test_directory_structure
test_permissions
test_docker
test_xcode
test_memory
show_summary
show_next_steps

# Exit code
if [ $TESTS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
