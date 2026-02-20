#!/bin/bash
echo "=== SysTracker System Integration Test ==="
echo ""

# Test 1: Server startup with validation
echo "Test 1: Server startup with validation and error logging..."
cd /workspaces/SysTracker/server
timeout 3 node server.js > /tmp/server_test.log 2>&1 &
sleep 2
if grep -q "SysTracker Server starting" /tmp/server_test.log; then
    echo "✓ Server started successfully with error logging"
else
    echo "✗ Server startup failed"
    cat /tmp/server_test.log
fi
pkill -f "node server.js" || true

echo ""

# Test 2: Database schema check
echo "Test 2: Checking database schema for profile columns..."
cd /workspaces/SysTracker/server
profile_cols=$(sqlite3 data/systracker.db "PRAGMA table_info(admin_users);" | grep -c "avatar\|display_name\|bio\|location")
if [ "$profile_cols" -ge 4 ]; then
    echo "✓ All profile columns present in database"
else
    echo "✗ Missing profile columns in database"
fi

echo ""

# Test 3: Error log check
echo "Test 3: Verifying error logging functionality..."
log_file=$(find /workspaces/SysTracker/server/logs -name "*.log" -type f 2>/dev/null | head -1)
if [ -n "$log_file" ] && grep -q "PID" "$log_file"; then
    echo "✓ Error logging with PID tracking working"
    echo "  Log file: $log_file"
else
    echo "✗ Error logging not functioning"
fi

echo ""

# Test 4: Validation modules check
echo "Test 4: Checking validation modules are installed..."
if [ -f "/workspaces/SysTracker/server/dataValidation.js" ]; then
    echo "✓ Data validation module present"
else
    echo "✗ Data validation module missing"
fi

echo ""

# Test 5: Dashboard build check
echo "Test 5: Checking dashboard build..."
if [ -d "/workspaces/SysTracker/dashboard/.next" ]; then
    echo "✓ Dashboard built successfully"
else
    echo "✗ Dashboard build missing"
fi

echo ""
echo "=== Integration Test Complete ==="
