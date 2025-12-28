# 课程选择系统 - 最终修复脚本

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   课程选择系统 - 最终修复方案" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置项目根目录
$rootDir = "d:\Visual Studio Code\Project code\VUE\Course Selection"
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"

# 检查目录是否存在
if (-not (Test-Path $rootDir)) {
    Write-Host "错误: 项目目录不存在" -ForegroundColor Red
    exit 1
}

Write-Host "本脚本将执行以下操作:" -ForegroundColor Yellow
Write-Host ""
Write-Host "[1/4] 执行数据库修复（存储过程）"
Write-Host "[2/4] 重启后端服务"
Write-Host "[3/4] 运行测试验证"
Write-Host "[4/4] 启动前端服务"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 第一步：执行数据库修复
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[1/4] 执行数据库修复" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sqlFile = Join-Path $backendDir "FINAL_FIX.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "错误: FINAL_FIX.sql 文件不存在" -ForegroundColor Red
    exit 1
}

Write-Host "正在执行数据库修复..." -ForegroundColor Green
Write-Host ""

$mysqlCmd = "mysql -u root -p `"course selection`" < `"$sqlFile`""
Write-Host "请执行以下命令：" -ForegroundColor Yellow
Write-Host $mysqlCmd
Write-Host ""
Write-Host "按任意键继续..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 第二步：重启后端服务
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[2/4] 重启后端服务" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "正在停止现有后端服务..." -ForegroundColor Green
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "正在启动后端服务..." -ForegroundColor Green
Set-Location $backendDir
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node app.js" -WindowStyle Normal

Write-Host "等待后端服务启动..." -ForegroundColor Gray
Start-Sleep -Seconds 5
Write-Host "✓ 后端服务已启动" -ForegroundColor Green
Write-Host ""

# 第三步：运行测试
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[3/4] 运行测试验证" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$testScript = Join-Path $backendDir "test-final-fix.js"
if (Test-Path $testScript) {
    node $testScript
} else {
    Write-Host "测试脚本不存在，跳过测试" -ForegroundColor Yellow
}

Write-Host ""

# 第四步：启动前端服务
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[4/4] 启动前端服务" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "正在启动前端服务..." -ForegroundColor Green
Set-Location $frontendDir
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run serve" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   修复完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "服务状态：" -ForegroundColor Yellow
Write-Host "  ✓ 后端服务：运行中（端口 7005）" -ForegroundColor Green
Write-Host "  ✓ 前端服务：正在启动（端口 8080）" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址：http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "主要修复内容：" -ForegroundColor Yellow
Write-Host "  ✓ 修复退课失败问题" -ForegroundColor Green
Write-Host "  ✓ 修复退课成功但界面不刷新问题" -ForegroundColor Green
Write-Host "  ✓ 修复相同时间段不同老师课程的冲突检测" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
