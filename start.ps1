# ESP Studio - Quick Start Script (PowerShell)
$ErrorActionPreference = 'Stop'

Write-Host '========================================================' -ForegroundColor Cyan
Write-Host '  ESP Studio - Hybrid Embedded IDE for ESP32 / ESP32-S3' -ForegroundColor Cyan
Write-Host '========================================================' -ForegroundColor Cyan
Write-Host ''

# 1. Verify Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error 'Node.js is not found in PATH. Please install Node.js 18+ from https://nodejs.org/'
    exit 1
}

# 2. Check dependencies
if (-not (Test-Path 'node_modules')) {
    Write-Host '[INIT] First run detected. Installing workspace dependencies...' -ForegroundColor Yellow
    npm install
}

# 3. Launch Web IDE
Write-Host '[READY] Launching ESP Studio web workspace...' -ForegroundColor Green
Write-Host '[URL]   http://localhost:5173' -ForegroundColor Green

Start-Process 'http://localhost:5173'
npm run dev
