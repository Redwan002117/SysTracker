#!/bin/bash

# SysTracker Cross-Platform Installation Validator
# Detects OS and runs appropriate validation script
# Usage: ./validate_install.sh [service-name] [port] [install-dir]

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Darwin*)
            echo "macos"
            ;;
        Linux*)
            echo "linux"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            echo "windows"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

OS=$(detect_os)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Detected OS: $OS"

case "$OS" in
    windows)
        # For Windows, use PowerShell validation
        if command -v powershell &>/dev/null; then
            echo "Running Windows validation..."
            powershell -NoProfile -ExecutionPolicy Bypass \
                -File "$SCRIPT_DIR/validate_windows_install.ps1" "$@"
        else
            echo "Error: PowerShell not found. Please run validate_windows_install.ps1 manually."
            exit 1
        fi
        ;;
    macos)
        # For macOS
        echo "Running macOS validation..."
        if [ -x "$SCRIPT_DIR/validate_macos_install.sh" ]; then
            bash "$SCRIPT_DIR/validate_macos_install.sh" "$@"
        else
            echo "Error: validate_macos_install.sh not found or not executable"
            exit 1
        fi
        ;;
    linux)
        # For Linux
        echo "Running Linux validation..."
        if [ -x "$SCRIPT_DIR/validate_linux_install.sh" ]; then
            bash "$SCRIPT_DIR/validate_linux_install.sh" "$@"
        else
            echo "Error: validate_linux_install.sh not found or not executable"
            exit 1
        fi
        ;;
    *)
        echo "Error: Unable to determine OS type"
        exit 1
        ;;
esac
