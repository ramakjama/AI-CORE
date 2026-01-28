# PowerShell script to install and setup Playwright tests
# Run with: .\install-tests.ps1

Write-Host "Installing Playwright Testing Infrastructure..." -ForegroundColor Green

# Check if pnpm is installed
Write-Host "`nChecking for pnpm..." -ForegroundColor Yellow
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm not found. Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
} else {
    Write-Host "pnpm is already installed" -ForegroundColor Green
}

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
pnpm install

# Install Playwright browsers
Write-Host "`nInstalling Playwright browsers..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Cyan
npx playwright install

# Install system dependencies (for Linux)
if ($IsLinux) {
    Write-Host "`nInstalling system dependencies..." -ForegroundColor Yellow
    npx playwright install-deps
}

# Create directories for test artifacts
Write-Host "`nCreating test directories..." -ForegroundColor Yellow
$directories = @(
    "test-results",
    "playwright-report",
    "tests/screenshots"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "Already exists: $dir" -ForegroundColor Cyan
    }
}

# Update .gitignore
Write-Host "`nUpdating .gitignore..." -ForegroundColor Yellow
$gitignoreContent = Get-Content ".gitignore.tests" -Raw
$gitignorePath = ".gitignore"

if (Test-Path $gitignorePath) {
    Add-Content -Path $gitignorePath -Value "`n# Playwright Test Artifacts"
    Add-Content -Path $gitignorePath -Value $gitignoreContent
    Write-Host ".gitignore updated" -ForegroundColor Green
} else {
    Write-Host "Warning: .gitignore not found" -ForegroundColor Yellow
}

# Run a test to verify installation
Write-Host "`nRunning verification test..." -ForegroundColor Yellow
Write-Host "This will start the dev server and run a simple test..." -ForegroundColor Cyan

$testOutput = npx playwright test tests/auth.spec.ts --grep "should display login form" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Installation successful!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Start the dev server: pnpm dev" -ForegroundColor White
    Write-Host "2. Run all tests: pnpm test" -ForegroundColor White
    Write-Host "3. Run tests with UI: pnpm test:ui" -ForegroundColor White
    Write-Host "4. View test report: pnpm test:report" -ForegroundColor White
    Write-Host "`nDocumentation:" -ForegroundColor Yellow
    Write-Host "- Full guide: docs/TESTING_GUIDE.md" -ForegroundColor White
    Write-Host "- Quick start: tests/README.md" -ForegroundColor White
} else {
    Write-Host "`n⚠️ Installation completed with warnings" -ForegroundColor Yellow
    Write-Host "Some tests may have failed. This is normal if the dev server is not running." -ForegroundColor Cyan
    Write-Host "`nTo run tests:" -ForegroundColor Yellow
    Write-Host "1. Start dev server in one terminal: pnpm dev" -ForegroundColor White
    Write-Host "2. Run tests in another terminal: pnpm test" -ForegroundColor White
}

Write-Host "`n" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Playwright Testing Infrastructure Ready  " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`n"
