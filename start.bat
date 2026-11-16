@echo off
setlocal
title ESP Studio - Embedded Development Platform

echo ========================================================
echo   ESP Studio — Hybrid Embedded IDE for ESP32 / ESP32-S3
echo ========================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH.
    echo Please install Node.js v18 or newer from https://nodejs.org/
    pause
    exit /b 1
)

:: Install dependencies if node_modules is missing
if not exist "node_modules" (
    echo [INIT] Installing workspace dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo [READY] Launching ESP Studio in development mode...
echo [URL]   Opening http://localhost:5173
echo.
echo Press Ctrl+C in this terminal to stop the IDE server.
echo.

start "" "http://localhost:5173"
call npm run dev
