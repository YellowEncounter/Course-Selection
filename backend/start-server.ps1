# 启动后端服务的 PowerShell 脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "启动后端服务" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置工作目录
$backendDir = "d:\Visual Studio Code\Project code\VUE\Course Selection\backend"
Set-Location $backendDir

Write-Host "工作目录: $backendDir" -ForegroundColor Green
Write-Host ""

# 检查端口是否被占用
Write-Host "检查端口 7005..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr ":7005"

if ($portCheck) {
    Write-Host "端口 7005 已被占用" -ForegroundColor Red
    Write-Host $portCheck
    Write-Host ""
    Write-Host "尝试终止占用进程..." -ForegroundColor Yellow
    
    $portCheck -split '\s+' | ForEach-Object {
        if ($_ -match '^\d+$') {
            $processId = $_
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process -and $process.ProcessName -eq 'node') {
                Write-Host "终止进程 PID: $processId" -ForegroundColor Yellow
                Stop-Process -Id $processId -Force
            }
        }
    }
    
    Start-Sleep -Seconds 1
} else {
    Write-Host "端口 7005 空闲" -ForegroundColor Green
}

Write-Host ""

# 检查 Node.js
Write-Host "检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js 未安装或未添加到 PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 启动服务
Write-Host "启动后端服务..." -ForegroundColor Yellow
Write-Host "命令: node app.js" -ForegroundColor Gray
Write-Host ""

# 启动 Node.js 进程
try {
    $process = Start-Process -FilePath "node" -ArgumentList "app.js" -NoNewWindow -PassThru -ErrorAction Stop
    
    Write-Host "服务已启动" -ForegroundColor Green
    Write-Host "进程 ID: $($process.Id)" -ForegroundColor Cyan
    Write-Host ""
    
    # 等待服务启动
    Write-Host "等待服务启动..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    # 检查端口
    $portCheck = netstat -ano | findstr ":7005"
    
    if ($portCheck) {
        Write-Host "✅ 服务启动成功！端口 7005 已监听" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "后端服务运行中" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "地址: http://localhost:7005" -ForegroundColor White
        Write-Host "测试接口: http://localhost:7005/api/pbl/getUser-1" -ForegroundColor White
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Yellow
        
        # 保持运行
        $process.WaitForExit()
    } else {
        Write-Host "❌ 服务启动失败，端口未监听" -ForegroundColor Red
        Write-Host ""
        Write-Host "可能的原因：" -ForegroundColor Yellow
        Write-Host "1. 数据库连接失败" -ForegroundColor White
        Write-Host "2. 依赖包未安装" -ForegroundColor White
        Write-Host "3. 端口被占用" -ForegroundColor White
        Write-Host ""
        Write-Host "请运行: npm install" -ForegroundColor Cyan
    }
} catch {
    Write-Host "启动失败: $_" -ForegroundColor Red
    exit 1
}
