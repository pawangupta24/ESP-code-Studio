#!/usr/bin/env bash
# ==============================================================================
# ESP Studio — Quick Start Launcher for Linux & macOS
# ==============================================================================
set -e

echo -e "\033[1;36m========================================================\033[0m"
echo -e "\033[1;36m  ESP Studio — Hybrid Embedded IDE for ESP32 / ESP32-S3 \033[0m"
echo -e "\033[1;36m========================================================\033[0m"
echo ""

# 1. Verify Node.js
if ! command -v node >/dev/null 2>&1; then
    echo -e "\033[1;31m[ERROR] Node.js is not found in PATH.\033[0m"
    echo "Please install Node.js 18 or newer:"
    echo "  - Linux (Ubuntu/Debian): sudo apt install nodejs npm"
    echo "  - macOS: brew install node"
    exit 1
fi

# 2. Check workspace dependencies
if [ ! -d "node_modules" ]; then
    echo -e "\033[1;33m[INIT] First run detected. Installing workspace dependencies...\033[0m"
    npm install
fi

echo -e "\033[1;32m[READY] Launching ESP Studio web workspace...\033[0m"
echo -e "\033[1;32m[URL]   http://localhost:5173\033[0m"
echo ""

# 3. Open browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "http://localhost:5173" || true
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux desktop
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "http://localhost:5173" >/dev/null 2>&1 &
    fi
fi

# 4. Start local development server
npm run dev
