@echo off
title BurnoutGuard - Dev Launcher

echo Starting BurnoutGuard: backend, frontend, and ml-service...
echo Each service opens in its own window. Close a window to stop that service.
echo.

start "BurnoutGuard - Backend" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 2 /nobreak >nul

start "BurnoutGuard - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 2 /nobreak >nul

start "BurnoutGuard - ML Service" cmd /k "cd /d %~dp0ml-service && if exist .venv\Scripts\python.exe (.venv\Scripts\python.exe main.py) else (python main.py)"

echo.
echo All three services launching in separate windows.
echo This launcher window can be closed safely.
pause
