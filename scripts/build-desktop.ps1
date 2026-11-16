# ESP Studio - Desktop App Builder (Tauri 2)
$ErrorActionPreference = 'Stop'

Write-Host '========================================================' -ForegroundColor Cyan
Write-Host '  ESP Studio - Building Desktop Application (Tauri 2)' -ForegroundColor Cyan
Write-Host '========================================================' -ForegroundColor Cyan
Write-Host ''

# 1. Verify Rust / Cargo
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Warning 'Rust toolchain (cargo) is not detected in PATH.'
    Write-Warning 'To compile the native Windows .exe / MSI installer:'
    Write-Warning '1. Install Rust from https://rustup.rs/'
    Write-Warning '2. Run this script again.'
    Write-Host ''
    Write-Host 'Building web distribution first...' -ForegroundColor Yellow
}

# 2. Build Web Bundle
Write-Host '[BUILD 1/2] Compiling web frontend bundle...' -ForegroundColor Green
npm --workspace=@esp-studio/web run build

if (Get-Command cargo -ErrorAction SilentlyContinue) {
    # 3. Build Tauri Desktop Binary
    Write-Host '[BUILD 2/2] Compiling Tauri 2 desktop binary...' -ForegroundColor Green
    npm --workspace=@esp-studio/desktop run build
    Write-Host '[SUCCESS] Desktop binary created in apps/desktop/src-tauri/target/release/' -ForegroundColor Green
} else {
    Write-Host '[INFO] Frontend bundle compiled to apps/web/dist successfully.' -ForegroundColor Green
}
