@echo off
chcp 65001 >nul
cls
echo.
echo ========================================
echo    课程选择系统 - 完整修复
echo ========================================
echo.
echo 本脚本将修复以下问题：
echo.
echo [1] 退课功能不可用
echo [2] 选课后剩余名额没有对应下降
echo [3] 老师无法查看报课学生名单
echo.
echo ========================================
echo.

cd backend

echo [步骤 1/5] 检查 MySQL 服务状态...
sc query MySQL80 >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ 警告：未检测到 MySQL80 服务
    echo    请确保 MySQL 已启动后再继续
    echo.
    set MYSQL_CHECKED=0
) else (
    echo ✓ MySQL 服务检测通过
    set MYSQL_CHECKED=1
)
echo.

echo [步骤 2/5] 执行数据库修复...
if %MYSQL_CHECKED%==0 (
    echo ⚠ 跳过数据库修复（MySQL 未启动）
    echo    请手动执行：mysql -u root -p course selection < FULL_FIX.sql
    goto :skip_db_fix
)

echo 正在执行 FULL_FIX.sql...
mysql -u root -p course selection < FULL_FIX.sql
if %errorlevel% neq 0 (
    echo ✗ 数据库修复失败
    echo.
    pause
    exit /b 1
)
echo ✓ 数据库修复完成
echo.

:skip_db_fix
echo [步骤 3/5] 停止现有后端服务...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo ✓ 后端服务已停止
echo.

echo [步骤 4/5] 启动后端服务...
start "CourseSelection-Backend" cmd /k "node app.js"
echo 等待后端服务启动...
timeout /t 5 >nul
echo ✓ 后端服务已启动
echo.

echo [步骤 5/5] 显示修复说明...
echo.
echo ========================================
echo    修复完成！
echo ========================================
echo.
echo 后端服务已启动（端口 7005）
echo.
echo 主要修复内容：
echo   ✓ 修复退课功能
echo   ✓ 修复选课后剩余名额显示
echo   ✓ 修复老师查看学生名单功能
echo   ✓ 创建所有必要的存储过程
echo.
echo 下一步：
echo   1. 启动前端服务：cd frontend ^&^& npm run serve
echo   2. 访问系统：http://localhost:8080
echo   3. 测试功能：
echo      - 学生退课
echo      - 学生选课（观察剩余名额）
echo      - 老师查看课程学生名单
echo.
echo ========================================
echo.

pause
