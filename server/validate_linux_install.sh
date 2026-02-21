#!/bin/bash

# SysTracker Linux Installation Validation Test
# Usage: ./validate_linux_install.sh [service-name] [port] [install-dir]

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

run_test() {
    local name="$1"
    local command="$2"
    ((TESTS_TOTAL++))
    
    if eval "$command" &>/dev/null; then
        test_pass "$name"
    else
        test_fail "$name"
    fi
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
    echo -e "${BLUE}║  SysTracker - Installation Validation   ║${NC}"
    echo -e "${BLUE}╚═════════════════════════════════════════╝${NC}"
    echo -e "${GRAY}Service: $SERVICE_NAME${NC}"
    echo -e "${GRAY}Port: $PORT${NC}"
    echo -e "${GRAY}Location: $INSTALL_DIR${NC}"
}

test_user_privileges() {
    header "1. USER PRIVILEGES"
    
    if [ "$EUID" -eq 0 ]; then
        test_pass "Running with root privileges"
    else
        echo -e "  ${YELLOW}⚠ WARNING${NC}  Not running as root"
        echo -e "         ${GRAY}Some tests may require sudo${NC}"
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

test_port_available() {
    header "4. PORT AVAILABILITY"
    
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        test_pass "Port $PORT listening"
    else
        test_fail "Port $PORT listening"
    fi
}

test_application_running() {
    header "5. APPLICATION PROCESS"
    
    if pgrep -f "server.js" >/dev/null 2>&1; then
        local memory=$(ps aux | grep 'server.js' | grep -v grep | awk '{print $6}')
        test_pass "Application process running" "Memory: ${memory}K"
    elif command -v docker &>/dev/null && docker ps 2>/dev/null | grep systracker >/dev/null; then
        test_pass "Docker container running"
    else
        test_fail "Application process running"
    fi
}

test_database() {
    header "6. DATABASE"
    
    local db_path="$INSTALL_DIR/data/systracker.db"
    
    if [ -f "$db_path" ]; then
        local size=$(du -h "$db_path" | cut -f1)
        test_pass "Database file exists" "Size: $size"
    else
        test_fail "Database file exists" "Not found at $db_path"
    fi
}

test_configuration() {
    header "7. CONFIGURATION"
    
    local env_path="$INSTALL_DIR/.env"
    
    if [ -f "$env_path" ]; then
        if grep -q "PORT=$PORT" "$env_path" 2>/dev/null || grep -q "PORT" "$env_path" 2>/dev/null; then
            test_pass "Configuration file exists"
        else
            test_pass "Configuration file exists" "(PORT setting may need update)"
        fi
    else
        test_fail "Configuration file (.env) exists"
    fi
}

test_dashboard() {
    header "8. DASHBOARD CONNECTIVITY"
    
    if command -v curl &>/dev/null; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null)
        if [ "$response" = "200" ] || [ "$response" = "302" ]; then
            test_pass "Dashboard accessible" "HTTP $response"
        else
            test_fail "Dashboard accessible" "HTTP $response"
        fi
    else
        echo -e "  ${YELLOW}⚠ SKIP${NC}   curl not available"
    fi
}

test_api() {
    header "9. API ENDPOINT"
    
    if command -v curl &>/dev/null; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/auth/status" 2>/dev/null)
        if [ "$response" = "200" ]; then
            test_pass "API responding" "HTTP $response"
        else
            test_fail "API responding" "HTTP $response"
        fi
    else
        echo -e "  ${YELLOW}⚠ SKIP${NC}   curl not available"
    fi
}

test_logs() {
    header "10. LOGS"
    
    local log_path="$INSTALL_DIR/logs/app.log"
    
    if [ -f "$log_path" ]; then
        local lines=$(wc -l < "$log_path")
        test_pass "Log file exists" "Lines: $lines"
    else
        echo -e "  ${YELLOW}⚠ INFO${NC}   Log file not yet created"
    fi
}

test_directory_structure() {
    header "11. DIRECTORY STRUCTURE"
    
    local dirs=("data" "logs" "uploads")
    local all_exist=true
    
    for dir in "${dirs[@]}"; do
        if [ -d "$INSTALL_DIR/$dir" ]; then
            test_pass "Directory: $dir"
        else
            test_fail "Directory: $dir"
            all_exist=false
        fi
    done
}

test_permissions() {
    header "12. FILE PERMISSIONS"
    
    if [ -w "$INSTALL_DIR/data" ]; then
        test_pass "Write permission on data directory"
    else
        test_fail "Write permission on data directory"
    fi
}

test_systemd_service() {
    header "13. SYSTEMD SERVICE"
    
    if command -v systemctl &>/dev/null; then
        if systemctl list-units --all 2>/dev/null | grep -q "$SERVICE_NAME"; then
            local status=$(systemctl is-active $SERVICE_NAME 2>/dev/null)
            if [ "$status" = "active" ]; then
                test_pass "Systemd service active" "Status: $status"
            else
                test_pass "Systemd service configured" "Status: $status"
            fi
        else
            echo -e "  ${YELLOW}⚠ INFO${NC}   Systemd service not configured"
        fi
    else
        echo -e "  ${YELLOW}⚠ INFO${NC}   systemd not available"
    fi
}

test_docker_running() {
    header "14. DOCKER STATUS"
    
    if command -v docker &>/dev/null; then
        if docker ps 2>/dev/null | grep -q systracker; then
            test_pass "Docker container running"
        else
            echo -e "  ${YELLOW}⚠ INFO${NC}   Docker installed but container not running"
        fi
    else
        echo -e "  ${YELLOW}⚠ INFO${NC}   Docker not installed (not required for standalone)"
    fi
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
}

# ============================================================================
# MAIN
# ============================================================================

show_intro
test_user_privileges
test_node_installed
test_npm_installed
test_port_available
test_application_running
test_database
test_configuration
test_dashboard
test_api
test_logs
test_directory_structure
test_permissions
test_systemd_service
test_docker_running
show_summary
show_next_steps

# Exit code
if [ $TESTS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
