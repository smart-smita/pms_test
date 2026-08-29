@echo off
title HTCO Backend REST API (Port 5000)
color 0A
echo ========================================================
echo Starting HTCO Backend REST API Server on http://localhost:5000
echo ========================================================
cd /d "%~dp0backend"
call npm install
call npm run dev
pause
