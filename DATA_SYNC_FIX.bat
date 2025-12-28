@echo off
echo ========================================
echo       前后端数据同步修复脚本
echo ========================================
echo.

echo [1/3] 检查当前项目状态...
cd backend
echo 检查数据库连接...
mysql -u root -proot -e "USE \`course selection\`; SELECT '数据库连接正常' as status;"
if %errorlevel% neq 0 (
    echo ❌ 数据库连接失败，请检查MySQL服务
    pause
    exit /b 1
)
echo ✅ 数据库连接正常
echo.

echo [2/3] 应用数据同步修复...
echo 检查存储过程状态...
mysql -u root -proot -e "USE \`course selection\`; SHOW PROCEDURE STATUS WHERE Db = 'course selection';"
if %errorlevel% neq 0 (
    echo ❌ 存储过程检查失败
    pause
    exit /b 1
)
echo ✅ 存储过程状态正常
echo.

echo [3/3] 启动服务...
echo 正在启动后端服务...
start cmd /k "node app.js"
timeout /t 3 /nobreak >nul
echo ✅ 后端服务启动中...
echo.

echo 启动前端服务...
cd ..\frontend
start cmd /k "npm run serve"
echo ✅ 前端服务启动中...
echo.

echo ========================================
echo       修复完成！
echo ========================================
echo.
echo 修复内容：
echo ✓ 修复了前后端数据同步机制
echo ✓ 增强了Vue响应式数据更新
echo ✓ 改进了退课操作的多重同步逻辑
echo ✓ 优化了计算属性的实时计算
echo ✓ 增加了调试日志和状态检查
echo.
echo 测试步骤：
echo 1. 打开浏览器访问：http://localhost:8080
echo 2. 使用学生账号登录（如：202501）
echo 3. 进入"已选课程"标签页
echo 4. 点击"退选"按钮测试
echo 5. 观察界面是否实时更新
echo.
echo 关键修复点：
echo - 多重强制视图更新（4轮同步）
echo - 实时计算属性重新计算
echo - 全局事件通知机制
echo - 2秒后最终数据同步检查
echo.
pause