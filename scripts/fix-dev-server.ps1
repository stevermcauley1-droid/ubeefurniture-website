# Fix dev server — kill hung processes, clean .next, restart
# Run: .\scripts\fix-dev-server.ps1

Write-Host "Stopping processes on ports 3000, 3001, 3002..." -ForegroundColor Yellow
$pids = @()
foreach ($port in 3000, 3001, 3002) {
    $conn = netstat -ano | findstr ":$port " | findstr "LISTENING"
    if ($conn) {
        $parts = $conn -split '\s+'
        $pid = $parts[-1]
        if ($pid -match '^\d+$') { $pids += $pid }
    }
}
$pids = $pids | Select-Object -Unique
foreach ($p in $pids) {
    try { taskkill /PID $p /F 2>$null; Write-Host "  Killed PID $p" } catch {}
}
Start-Sleep -Seconds 2

Write-Host "Removing .next folder..." -ForegroundColor Yellow
$nextPath = Join-Path $PSScriptRoot "..\.next"
if (Test-Path $nextPath) {
    Remove-Item -Recurse -Force $nextPath -ErrorAction SilentlyContinue
    Write-Host "  Done" -ForegroundColor Green
} else {
    Write-Host "  (none)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Starting dev server..." -ForegroundColor Yellow
Set-Location (Join-Path $PSScriptRoot "..")
npm run dev
