@echo off
setlocal EnableExtensions
title Tether Bunnies - Launcher
cd /d "%~dp0"
color 0B

echo.
echo ========================================================
echo    TETHER BUNNIES : CO-OP CHAOS ^& SOLO CAMPAIGN
echo              ONE-CLICK GAME LAUNCHER
echo ========================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed! Download from https://nodejs.org
  pause
  exit /b 1
)
echo [1/3] Node.js detected: OK

if not exist "node_modules\socket.io" (
  echo [2/3] Installing dependencies...
  call npm install --no-audit --no-fund
) else (
  echo [2/3] Dependencies: OK
)

echo [3/3] Starting Game Server on port 3000...
start "Tether Bunnies Server Window" cmd /k "node server.js"
timeout /t 2 /nobreak >nul

echo Opening game in your browser...
start "" "http://localhost:3000"

echo.
echo ========================================================
echo   Local Web Game:   http://localhost:3000
echo   Play online with friends: deploy to Render (see render.yaml)
echo ========================================================
echo.
echo Do you want a TEMPORARY public link for friends (localtunnel, slower)?
choice /c YN /t 15 /d N /m "Open temporary link"
if errorlevel 2 goto :end
echo Starting localtunnel...
call npx --yes localtunnel --port 3000

:end
echo.
echo Server keeps running in the other window. Close it to stop the game.
pause
