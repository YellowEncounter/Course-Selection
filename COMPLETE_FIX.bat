@echo off
echo ========================================
echo       课程选课系统完整修复脚本 v2.0
echo ========================================
echo.

echo [1/4] 应用基础数据库修复...
cd backend
mysql -u root -proot < FULL_FIX.sql
if %errorlevel% neq 0 (
    echo ❌ 基础数据库修复失败！
    pause
    exit /b 1
)
echo ✅ 基础数据库修复完成
echo.

echo [2/4] 应用退课功能专项修复...
mysql -u root -proot < quick-drop-fix.sql
if %errorlevel% neq 0 (
    echo ❌ 退课功能修复失败！
    pause
    exit /b 1
)
echo ✅ 退课功能修复完成
echo.

echo [3/4] 启动后端服务...
echo 正在启动后端服务...
start cmd /k "node app.js"
timeout /t 3 /nobreak >nul
echo ✅ 后端服务启动中...
echo.

echo [4/4] 启动前端服务...
cd ..\frontend
start cmd /k "npm run serve"
echo ✅ 前端服务启动中...
echo.

echo ========================================
echo       修复完成！
echo ========================================
echo.
echo 请检查以下服务是否正常启动：
echo 1. 后端服务：http://localhost:3000
echo 2. 前端服务：http://localhost:8080
echo.
echo 修复内容：
echo ✓ 修复退课功能（兼容多种数据类型）
echo ✓ 修复选课功能，确保名额实时更新
echo ✓ 修复教师端数据同步机制
echo ✓ 优化API响应处理
echo ✓ 增强数据一致性保证
echo.
echo 测试步骤：
echo 1. 打开浏览器访问：http://localhost:8080
echo 2. 使用学生账号登录
echo 3. 进入"已选课程"标签页
echo 4. 测试选课和退课功能
echo.
echo 如遇到问题，请查看 DROP_COURSE_FIX.md 文档
echo.
pause