@echo off
title Pine Labs Frontend - Vite React
echo Starting Pine Labs Frontend on port 5173...
cd /d "%~dp0\frontend"
node ".\node_modules\vite\bin\vite.js" --port 5173
pause
