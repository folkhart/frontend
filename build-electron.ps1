# Folkhart Electron Build Script (PowerShell)
# Run this from the frontend directory

Write-Host "🎮 Folkhart Electron Build Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the frontend directory" -ForegroundColor Yellow
    exit 1
}

# Step 1: Install dependencies
Write-Host "📦 Step 1/3: Installing dependencies..." -ForegroundColor Green
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Build web app
Write-Host ""
Write-Host "🏗️ Step 2/3: Building web app..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm run build failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Build Electron installer
Write-Host ""
Write-Host "🪟 Step 3/3: Building Windows installer..." -ForegroundColor Green
npm run electron:build:win
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Electron build failed!" -ForegroundColor Red
    exit 1
}

# Success!
Write-Host ""
Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Installer location:" -ForegroundColor Cyan
Write-Host "   dist-electron/Folkhart-*-Setup.exe" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your game is ready to install and play!" -ForegroundColor Magenta

# Open the output folder
if (Test-Path "dist-electron") {
    $openFolder = Read-Host "Open output folder? (Y/n)"
    if ($openFolder -ne "n") {
        Start-Process "dist-electron"
    }
}
