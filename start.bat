@echo off
REM -- First window: start slot-bp-server
start "slot-bp-server" cmd.exe /k ^
    "cd /d C:\Users\ADMIN\Documents\slot-bp-server && npm run start"

REM -- Second window: start slot-bp
start "slot-bp-dev" cmd.exe /k ^
    "cd /d C:\Users\ADMIN\Documents\slot-bp && npm run dev"

REM -- Finally, open Chrome to the Vite dev server
start "" "chrome" "http://localhost:5173"

exit /b
