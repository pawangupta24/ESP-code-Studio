# ESP Studio - Monorepo Full Build and Typecheck
$ErrorActionPreference = 'Stop'

Write-Host '========================================================' -ForegroundColor Cyan
Write-Host '  ESP Studio - Monorepo Typecheck and Build Verification' -ForegroundColor Cyan
Write-Host '========================================================' -ForegroundColor Cyan
Write-Host ''

Write-Host '[1/2] Running TypeScript Project Typechecks (tsc -b)...' -ForegroundColor Yellow
npx tsc -b
if ($LASTEXITCODE -eq 0) {
    Write-Host '  -> TypeScript check passed cleanly (0 errors)' -ForegroundColor Green
} else {
    Write-Error 'TypeScript check failed.'
    exit $LASTEXITCODE
}

Write-Host '[2/2] Building Web Application Bundle (Vite)...' -ForegroundColor Yellow
npm --workspace=@esp-studio/web run build
if ($LASTEXITCODE -eq 0) {
    Write-Host '  -> Vite web production build succeeded' -ForegroundColor Green
} else {
    Write-Error 'Web bundle build failed.'
    exit $LASTEXITCODE
}

Write-Host ''
Write-Host '[SUCCESS] All monorepo packages compiled and verified for production!' -ForegroundColor Green
