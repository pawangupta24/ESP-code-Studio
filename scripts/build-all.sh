#!/usr/bin/env bash
# ==============================================================================
# ESP Studio — Monorepo Typecheck & Build Verification (Linux / macOS)
# ==============================================================================
set -e

echo -e "\033[1;36m========================================================\033[0m"
echo -e "\033[1;36m  ESP Studio — Monorepo Build Verification (Unix)       \033[0m"
echo -e "\033[1;36m========================================================\033[0m"
echo ""

echo -e "\033[1;33m[1/3] Running TypeScript Project Typechecks (tsc -b)...\033[0m"
npx tsc -b
echo -e "\033[1;32m  -> TypeScript check passed cleanly (0 errors)\033[0m"

echo -e "\033[1;33m[2/3] Building Web Application Bundle (Vite)...\033[0m"
npm --workspace=@esp-studio/web run build
echo -e "\033[1;32m  -> Vite web production build succeeded\033[0m"

echo -e "\033[1;33m[3/3] Generating Release Archive (package:zip)...\033[0m"
node ./scripts/package-zip.js
echo -e "\033[1;32m  -> Archive created successfully\033[0m"

echo ""
echo -e "\033[1;32m[SUCCESS] All monorepo packages compiled and verified on $(uname -s)!\033[0m"
