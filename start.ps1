Write-Host "Starting Tourism System (Windows)..." -ForegroundColor Cyan

# Function to find Bun executable
function Get-BunPath {
    if (Get-Command "bun" -ErrorAction SilentlyContinue) {
        return "bun"
    }
    
    $userBunPath = "$env:USERPROFILE\.bun\bin\bun.exe"
    if (Test-Path $userBunPath) {
        Write-Host "Bun not found in global PATH, using: $userBunPath" -ForegroundColor Yellow
        return $userBunPath
    }
    
    return $null
}

$bunPath = Get-BunPath

if (-not $bunPath) {
    Write-Error "Bun not found! Please restart your terminal or run installation again."
    exit 1
}

# Build Shared Package
Write-Host "Building shared package..." -ForegroundColor Cyan
Start-Process -FilePath $bunPath -ArgumentList "--cwd packages/shared run build" -NoNewWindow -Wait
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Shared package build might have had issues."
}

# Start API
Write-Host "Starting API server..." -ForegroundColor Green
Start-Process -FilePath $bunPath -ArgumentList "run dev" -WorkingDirectory "apps/api"

Start-Sleep -Seconds 2

# Start Web
Write-Host "Starting Web server..." -ForegroundColor Green
Start-Process -FilePath $bunPath -ArgumentList "run dev" -WorkingDirectory "apps/web"

Write-Host "Servers started in separate windows!" -ForegroundColor Cyan
Write-Host "API: http://localhost:3000"
Write-Host "Web: http://localhost:5173"
Write-Host "You can close this window now."
