@echo off
chcp 65001 >nul
echo ========================================
echo 数据库最终修复
echo ========================================
echo.

echo 请确认 MySQL 已经启动
echo.
pause

echo 正在执行 SQL 修复...
mysql -u root -p course selection < FINAL_FIX.sql

if %errorlevel% neq 0 (
    echo.
    echo [错误] SQL 执行失败！
    echo.
    pause
    exit /b 1
)

echo.
echo [成功] 数据库修复完成！
echo.
echo 修复内容：
echo 1. 时间冲突检测函数（相同时间段不能选不同老师的课程）
echo 2. 选课存储过程（修复 LEAVE 语句问题）
echo 3. 退课存储过程（修复 LEAVE 语句问题）
echo.
echo 现在可以启动后端服务了
echo.
pause
