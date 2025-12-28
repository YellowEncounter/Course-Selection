@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo 启动后端服务
echo ========================================
echo.
node app.js
pause
