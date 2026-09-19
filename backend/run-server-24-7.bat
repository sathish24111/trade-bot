@echo off
cd /d "D:\Mob-trade\backend"
:loop
echo [%date% %time%] Starting TradePilot Backend... >> "D:\Mob-trade\backend\logs\server-daemon.log"
"C:\Program Files\nodejs\node.exe" dist/server.js >> "D:\Mob-trade\backend\logs\server-daemon.log" 2>&1
echo [%date% %time%] Backend stopped (code %errorlevel%). Restarting in 3 seconds... >> "D:\Mob-trade\backend\logs\server-daemon.log"
timeout /t 3 /nobreak >nul
goto loop
