@echo off
title AuraFeedback Backend Server
echo ===================================================
echo   Starting AuraFeedback Backend (MySQL 8.0)
echo ===================================================

set PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%

cd /d "%~dp0backend"
node server.js
pause
