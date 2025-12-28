@echo off
echo ========================================
echo       退课功能紧急修复脚本
echo ========================================
echo.

echo [1/3] 应用紧急数据库修复...
cd backend
mysql -u root -proot < emergency-drop-fix.sql
if %errorlevel% neq 0 (
    echo ❌ 紧急数据库修复失败！
    pause
    exit /b 1
)
echo ✅ 紧急数据库修复完成
echo.

echo [2/3] 启动后端服务...
echo 正在启动后端服务...
start cmd /k "node app.js"
timeout /t 3 /nobreak >nul
echo ✅ 后端服务启动中...
echo.

echo [3/3] 启动前端服务...
cd ..\frontend
start cmd /k "npm run serve"
echo ✅ 前端服务启动中...
echo.

echo ========================================
echo       紧急修复完成！
echo ========================================
echo.
echo 修复内容：
echo ✓ 重新创建了简单可靠的退课存储过程
echo ✓ 修复了后端API响应处理逻辑
echo ✓ 增强了错误处理和兼容性
echo.
echo 测试步骤：
echo 1. 打开浏览器访问：http://localhost:8080
echo 2. 使用学生账号登录（如：202501）
echo 3. 进入"已选课程"标签页
echo 4. 点击"退选"按钮测试
echo.
echo 如果仍有问题，请检查：
echo 1. 数据库连接是否正常
echo 2. 学生是否确实在课程中
echo 3. 控制台错误信息
echo.
pause