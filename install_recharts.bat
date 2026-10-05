@echo off
title Install Recharts for HTCO ERP Frontend
color 0D
echo ========================================================
echo Installing 'recharts' library in the frontend...
echo ========================================================
cd /d "%~dp0frontend"
call npm install recharts
echo.
echo Installation complete! 
echo Please refresh your browser tab. The dashboard should now load successfully!
echo.
pause
