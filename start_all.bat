@echo off
title HTCO Full-Stack Starter
color 0B
echo ========================================================
echo Starting HTCO Full-Stack Application (Backend + Frontend)
echo ========================================================
start "HTCO Backend API (Port 5000)" cmd /k "cd /d "%~dp0backend" && npm install && npm run dev"
timeout /t 3
start "HTCO Frontend Portal (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm install && npm run dev"
echo.
echo Both servers are launching in separate windows!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause
