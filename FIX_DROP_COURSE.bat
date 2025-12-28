@echo off
echo ========================================
echo       退课功能紧急修复脚本
echo ========================================
echo.

echo [1/3] 应用退课存储过程修复...
cd backend
mysql -u root -proot < debug-drop-course.sql
if %errorlevel% neq 0 (
    echo ❌ 数据库修复失败！
    pause
    exit /b 1
)
echo ✅ 数据库修复完成
echo.

echo [2/3] 测试退课功能...
echo 正在运行测试脚本...
node test-drop-course.js
echo.

echo [3/3] 启动后端服务...
echo 正在启动后端服务...
start cmd /k "node app.js"
timeout /t 3 /nobreak >nul
echo ✅ 后端服务启动中...
echo.

echo ========================================
echo       修复完成！
echo ========================================
echo.
echo 修复内容：
echo ✓ 修复退课存储过程的JSON搜索逻辑
echo ✓ 增强学生ID类型检查（支持数字和字符串）
echo ✓ 添加详细的调试信息输出
echo ✓ 优化错误处理和响应格式
echo.
echo 测试说明：
echo 1. 打开浏览器访问：http://localhost:8080
echo 2. 使用学生账号登录
echo 3. 尝试退选已选课程
echo 4. 如果仍有问题，请查看控制台输出
echo.
pause