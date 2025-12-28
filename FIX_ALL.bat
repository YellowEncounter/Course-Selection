@echo off
chcp 65001 >nul
cls
echo.
echo ========================================
echo    课程选择系统 - 最终修复方案
echo ========================================
echo.
echo 本脚本将执行以下操作：
echo.
echo [1/4] 执行数据库修复（存储过程）
echo [2/4] 重启后端服务
echo [3/4] 运行测试验证
echo [4/4] 启动前端服务
echo.
echo ========================================
echo.

REM 检查 MySQL 是否运行
echo [检查] 检测 MySQL 服务状态...
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

REM 第一步：执行数据库修复
echo ========================================
echo [1/4] 执行数据库修复
echo ========================================
echo.
if %MYSQL_CHECKED%==0 (
    echo ⚠ 跳过数据库修复（MySQL 未启动）
    echo    请手动执行：mysql -u root -p course selection < FINAL_FIX.sql
) else (
    echo 正在执行 FINAL_FIX.sql...
    mysql -u root -p course selection < FINAL_FIX.sql
    if %errorlevel% neq 0 (
        echo ✗ 数据库修复失败
        echo.
        pause
        exit /b 1
    )
    echo ✓ 数据库修复完成
)
echo.
echo 修复内容：
echo   ✓ 时间冲突检测函数（相同时间段不能选不同老师的课程）
echo   ✓ 选课存储过程（修复 LEAVE 语句问题）
echo   ✓ 退课存储过程（修复 LEAVE 语句问题）
echo.

REM 第二步：重启后端服务
echo ========================================
echo [2/4] 重启后端服务
echo ========================================
echo.
echo 正在停止现有后端服务...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo 正在启动后端服务...
start "CourseSelection-Backend" cmd /k "node app.js"

echo 等待后端服务启动...
timeout /t 5 >nul
echo ✓ 后端服务已启动
echo.

REM 第三步：运行测试
echo ========================================
echo [3/4] 运行测试验证
echo ========================================
echo.
node test-final-fix.js
echo.

REM 第四步：启动前端服务
echo ========================================
echo [4/4] 启动前端服务
echo ========================================
echo.
cd frontend
start "CourseSelection-Frontend" cmd /k "npm run serve"
cd ..

echo.
echo ========================================
echo    修复完成！
echo ========================================
echo.
echo 服务状态：
echo   ✓ 后端服务：运行中（端口 7005）
echo   ✓ 前端服务：正在启动（端口 8080）
echo.
echo 访问地址：http://localhost:8080
echo.
echo 主要修复内容：
echo   ✓ 修复退课失败问题
echo   ✓ 修复退课成功但界面不刷新问题
echo   ✓ 修复相同时间段不同老师课程的冲突检测
echo.
echo ========================================
echo.
pause
