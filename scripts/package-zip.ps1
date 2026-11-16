param(
    [string]$OutputZip = 'esp-studio-starter.zip'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$WorkspaceRoot = (Resolve-Path "$PSScriptRoot/..").Path
$ZipPath = Join-Path $WorkspaceRoot $OutputZip

Write-Host '==========================================' -ForegroundColor Cyan
Write-Host ' ESP Studio — Packaging Starter Project   ' -ForegroundColor Cyan
Write-Host '==========================================' -ForegroundColor Cyan
Write-Host ('Workspace Root: ' + $WorkspaceRoot)
Write-Host ('Target Archive: ' + $ZipPath)

if (Test-Path $ZipPath) {
    Remove-Item -Path $ZipPath -Force
    Write-Host 'Removed existing zip archive.' -ForegroundColor Yellow
}

$ExcludePatterns = @(
    'node_modules',
    '.pnpm-store',
    'dist',
    'build',
    'target',
    '.pio',
    '.git',
    'esp-studio-starter.zip'
)

Write-Host 'Packaging clean repository files...' -ForegroundColor Green

$TempDir = Join-Path ([System.IO.Path]::GetTempPath()) ('esp-studio-pkg-' + [System.Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

try {
    Get-ChildItem -Path $WorkspaceRoot -Exclude $ExcludePatterns | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $TempDir -Recurse -Force
    }

    Get-ChildItem -Path $TempDir -Recurse -Directory | Where-Object { 
        $_.Name -eq 'node_modules' -or $_.Name -eq 'dist' -or $_.Name -eq 'target'
    } | Remove-Item -Recurse -Force

    $SourceWildcard = Join-Path $TempDir '*'
    Compress-Archive -Path $SourceWildcard -DestinationPath $ZipPath -CompressionLevel Optimal
    Write-Host ('Successfully generated starter ZIP: ' + $ZipPath) -ForegroundColor Green
    $Size = [math]::Round((Get-Item $ZipPath).Length / 1KB, 2)
    Write-Host ('Archive Size: ' + $Size + ' KB') -ForegroundColor Green
}
finally {
    if (Test-Path $TempDir) {
        Remove-Item -Path $TempDir -Recurse -Force
    }
}
