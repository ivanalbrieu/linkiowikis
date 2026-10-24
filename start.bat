@echo off
setlocal enabledelayedexpansion

title LinkioWikis Server
cls

echo ==========================================================
echo               LinkioWikis Development Server
echo ==========================================================
echo.

:: 1. Verify Node.js installation
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your PATH.
    echo Please install Node.js from https://nodejs.org/ before running.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo [INFO] Node version: %NODE_VER%
echo [INFO] NPM version:  %NPM_VER%

:: 2. Check for .env file
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] .env not found. Creating from .env.example...
        copy ".env.example" ".env" >nul
        echo [INFO] Created .env file.
    ) else (
        echo [WARN] No .env or .env.example file found.
    )
)

:: 3. Check dependencies
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Running npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b %errorlevel%
    )
)

:: 4. Check compiled Tailwind CSS
if not exist "public\css\tailwind.css" (
    echo [INFO] Compiled Tailwind CSS not found. Building styles...
    call npm run build:css
)

:: 5. MySQL / XAMPP Reminder
echo [INFO] Database: MySQL (ensure XAMPP MySQL is running on port 3306)
echo.
echo ==========================================================
echo   Starting LinkioWikis on http://localhost:3000/wiki/
echo   Press Ctrl+C to stop the server
echo ==========================================================
echo.

:: 6. Launch Application
node app.js

:: If the server crashes or exits with an error, prevent terminal from instantly closing
if %errorlevel% neq 0 (
    echo.
    echo ==========================================================
    echo [ERROR] Server terminated unexpectedly with exit code %errorlevel%.
    echo Check the error logs above for details.
    echo ==========================================================
    echo.
    pause
)
