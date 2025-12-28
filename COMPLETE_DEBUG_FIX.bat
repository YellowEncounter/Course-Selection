@echo off
echo ========================================
echo       退课功能完整调试修复脚本
echo ========================================
echo.

echo [1/6] 应用综合修复到数据库...
cd backend
mysql -u root -proot < comprehensive-drop-fix.sql
if %errorlevel% neq 0 (
    echo ❌ 数据库修复失败！
    pause
    exit /b 1
)
echo ✅ 数据库修复完成
echo.

echo [2/6] 运行后端调试脚本...
echo 调试退课功能（学生ID: 202501, 课程ID: 13）...
node debug-drop-course.js 202501 13
echo.
echo 按任意键继续...
pause > nul
echo.

echo [3/6] 启动后端服务...
start cmd /k "node app.js"
echo ✅ 后端服务启动中...
timeout /t 3 /nobreak >nul
echo.

echo [4/6] 启动前端服务...
cd ..\frontend
start cmd /k "npm run serve"
echo ✅ 前端服务启动中...
timeout /t 3 /nobreak >nul
echo.

echo [5/6] 打开调试页面...
echo 正在打开前端调试页面...
start http://localhost:8080/debug-drop-test.html
timeout /t 2 /nobreak >nul
echo ✅ 调试页面已打开
echo.

echo [6/6] 打开应用页面...
echo 正在打开主应用页面...
start http://localhost:8080
echo ✅ 主应用页面已打开
echo.

echo ========================================
echo       调试和修复完成！
echo ========================================
echo.
echo 🔍 问题分析工具：
echo 1. 调试页面: http://localhost:8080/debug-drop-test.html
echo 2. 主应用页面: http://localhost:8080
echo.
echo 📋 完整错误分析流程：
echo ========================================
echo.
echo 1) 完整错误堆栈信息：
echo    - 打开调试页面，执行退课测试
echo    - 查看浏览器控制台错误堆栈
echo    - 检查API请求和响应详情
echo.
echo 2) 详细复现步骤：
echo    - 使用学生账号（202501）登录
echo    - 进入"已选课程"标签页
echo    - 点击任意课程的"退选"按钮
echo    - 观察错误信息和控制台输出
echo.
echo 3) 前端课程选择状态数据：
echo    - 调试页面显示当前前端状态
echo    - 包括已选课程数量和详细信息
echo    - 验证学生是否真的在课程中
echo.
echo 4) 后端接口请求参数和响应数据：
echo    - 调试页面会发送真实API请求
echo    - 显示完整的请求参数
echo    - 显示后端响应的详细信息
echo.
echo 5) 前后端交互时序图：
echo    - 调试页面实时显示交互流程
echo    - 记录每个步骤的时间和状态
echo    - 帮助定位具体问题点
echo.
echo 🔧 修复内容：
echo ========================================
echo.
echo ✓ 修复存储过程的多种数据类型匹配问题
echo ✓ 增强字符串匹配逻辑（3种方式）
echo ✓ 添加详细的调试信息输出
echo ✓ 优化JSON操作和数据转换
echo ✓ 创建备选的简化存储过程
echo.
echo ⚡ 重点排查：
echo ========================================
echo.
echo 1. 前端课程选择状态标记逻辑：
echo    - isSelected()方法的实现
echo    - 计算属性selectedCourses的逻辑
echo    - 数据类型一致性问题
echo.
echo 2. 后端接口验证机制：
echo    - 存储过程的学生检查逻辑
echo    - JSON数据解析和匹配
echo    - 多种数据格式兼容性
echo.
echo 3. 前后端数据传递一致性：
echo    - API参数类型和格式
echo    - 响应数据结构解析
echo    - 错误信息传递机制
echo.
echo 🎯 问题根源分析：
echo ========================================
echo.
echo 根据之前的分析，"您未选择此课程"错误主要由以下原因造成：
echo.
echo 1. 数据类型不匹配：
echo    - 前端传递数字类型学生ID
echo    - 后端存储过程期望字符串类型
echo    - JSON函数对类型敏感导致匹配失败
echo.
echo 2. 存储过程逻辑缺陷：
echo    - JSON_CONTAINS函数类型敏感
echo    - JSON_SEARCH函数返回null
echo    - 字符串匹配逻辑不完整
echo.
echo 3. 前端状态管理问题：
echo    - 数据加载时机问题
echo    - Vue响应式更新延迟
echo    - 计算属性缓存问题
echo.
echo 📝 测试步骤：
echo ========================================
echo.
echo 1. 在调试页面测试API功能
echo 2. 在主应用中测试用户操作流程
echo 3. 检查浏览器控制台错误信息
echo 4. 验证数据库数据更新情况
echo 5. 确认前端界面实时更新
echo.
pause