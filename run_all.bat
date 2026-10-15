@echo off
title Pine Labs Talent Intelligence Platform Launcher
echo ============================================================
echo   Starting Pine Labs Talent Intelligence Platform
echo ============================================================
echo.
echo 1. Launching Backend Server (port 8000)...
start "Pine Labs Backend" cmd /c "%~dp0run_backend.bat"

echo 2. Launching Frontend Server (port 5173)...
start "Pine Labs Frontend" cmd /c "%~dp0run_frontend.bat"

echo.
echo Both servers are launching in separate windows!
echo - Frontend:  http://localhost:5173/
echo - Dashboard: http://localhost:5173/dashboard
echo - API Docs:  http://localhost:8000/api/docs
echo.
timeout /t 3 >nul
start http://localhost:5173/
