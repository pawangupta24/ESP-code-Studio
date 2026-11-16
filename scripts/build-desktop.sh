#!/usr/bin/env bash
# ==============================================================================
# ESP Studio — Desktop App Builder (Tauri 2) for Linux & macOS
# ==============================================================================
set -e

echo -e "\033[1;36m========================================================\033[0m"
echo -e "\033[1;36m  ESP Studio — Desktop Builder (Linux / macOS)          \033[0m"
echo -e "\033[1;36m========================================================\033[0m"
echo ""

# 1. Verify Rust / Cargo
if ! command -v cargo >/dev/null 2>&1; then
    echo -e "\033[1;33m[WARNING] Rust toolchain (cargo) is not detected in PATH.\033[0m"
    echo "To compile native desktop binaries:"
    echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    echo ""
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "For Linux desktop builds, install native dependencies:"
        echo "  sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev"
    fi
    echo ""
    echo "Building web bundle first..."
fi

# 2. Build Web Frontend Bundle
echo -e "\033[1;32m[BUILD 1/2] Compiling web frontend bundle...\033[0m"
npm --workspace=@esp-studio/web run build

if command -v cargo >/dev/null 2>&1; then
    # 3. Build Tauri Desktop Binary
    echo -e "\033[1;32m[BUILD 2/2] Compiling Tauri 2 desktop binary on $(uname -s)...\033[0m"
    npm --workspace=@esp-studio/desktop run build
    echo -e "\033[1;32m[SUCCESS] Desktop binary created in apps/desktop/src-tauri/target/release/\033[0m"
else
    echo -e "\033[1;34m[INFO] Frontend bundle compiled to apps/web/dist successfully.\033[0m"
fi
