@echo off
chcp 65001
cls
echo ==========================================
echo      Treehole System Launcher
echo ==========================================
echo.

cd /d "C:\Users\justi\Documents\GitHub\---hbbss-treehole-system"

echo [1/2] Starting backend server...
echo.

if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)

echo Starting backend...
start "Backend Server" cmd /k "npm start"

echo.
echo [2/2] Starting frontend app...
echo.

cd client

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

echo Starting frontend...
start "Frontend App" cmd /k "npm start"

echo.
echo ==========================================
echo      Launch Complete!
echo ==========================================
echo.
echo Please wait a few seconds, then visit:
echo   - Frontend: http://localhost:3000
echo   - Backend: http://localhost:5000
echo.
pause
