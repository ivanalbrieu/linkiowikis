@echo off
setlocal

title LinkioWikis Development Server
cd /d "%~dp0"
cls

echo ==========================================================
echo               LinkioWikis Development Server
echo ==========================================================
echo.

:: 1. Verify Node.js installation
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not found in your PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set "NODE_VER=%%i"
for /f "tokens=*" %%i in ('npm -v') do set "NPM_VER=%%i"

echo [INFO] Node version: %NODE_VER%
echo [INFO] NPM version:  %NPM_VER%
echo.

:: 2. Check for .env file
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Creating .env from .env.example...
        copy ".env.example" ".env" >nul
        if errorlevel 1 (
            echo [ERROR] Could not create .env.
            pause
            exit /b 1
        )
        echo [INFO] Created .env file.
    ) else (
        echo [WARN] No .env or .env.example file found.
    )
)

:: 3. Check dependencies
if not exist "node_modules\" (
    echo [INFO] Dependencies not found. Running npm install...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

:: 4. Check compiled Tailwind CSS
if not exist "public\css\tailwind.css" (
    echo [INFO] Compiled Tailwind CSS not found. Building styles...
    call npm run build:css
    if errorlevel 1 (
        echo [ERROR] Tailwind CSS build failed.
        pause
        exit /b 1
    )
)

:: 5. Database reminder
echo [INFO] Database: MySQL
echo [INFO] Ensure your configured database is running.
echo.
echo ==========================================================
echo   Starting LinkioWikis on http://localhost:3000/wiki/
echo   The browser will open when port 3000 becomes available.
echo   Press Ctrl+C to stop the server.
echo ==========================================================
echo.

:: 6. Wait for the server in a separate PowerShell process.
:: This allows Node.js to run normally in the current window.
start "" /b powershell.exe -NoProfile -Command "$ready = $false; for ($i = 0; $i -lt 60; $i++) { $client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', 3000); $client.Close(); $ready = $true; break } catch { Start-Sleep -Milliseconds 500 } finally { $client.Dispose() } }; if ($ready) { Start-Process 'http://localhost:3000/wiki/' } else { Write-Host '[WARN] Server did not become available within 30 seconds.' }"

:: 7. Launch application
node app.js