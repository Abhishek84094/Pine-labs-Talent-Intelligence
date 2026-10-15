@echo off
title Pine Labs Backend - FastAPI
echo Starting Pine Labs Backend on port 8000...
cd /d "%~dp0\backend"
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
