@echo off
chcp 65001 >nul
echo ========================================
echo    选课系统问题修复 - 快速部署
echo ========================================
echo.
cd /d " d:\Visual Studio Code\Project code\VUE\Course Selection\backend\
echo.
echo [1/3] 正在更新数据库...
mysql -u root -proot \course selection\ < quick-fix.sql
