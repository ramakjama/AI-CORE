# Tasks Feature Installation Verification Script
# Run this script to verify all tasks feature files are in place

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Tasks Feature Installation Verification" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# Function to check file exists
function Test-FileExists {
    param($Path, $Description)
    if (Test-Path $Path) {
        Write-Host "✓ $Description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ $Description - NOT FOUND" -ForegroundColor Red
        $script:errors++
        return $false
    }
}

# Check main files
Write-Host "Checking Main Files..." -ForegroundColor Yellow
Test-FileExists "src\app\tasks\page.tsx" "Main tasks page component"
Test-FileExists "src\types\tasks.ts" "TypeScript type definitions"
Test-FileExists "src\lib\mock-tasks.ts" "Mock data for development"

Write-Host ""

# Check documentation
Write-Host "Checking Documentation..." -ForegroundColor Yellow
Test-FileExists "src\app\tasks\README.md" "Feature documentation"
Test-FileExists "TASKS_FEATURE_SUMMARY.md" "Complete implementation guide"
Test-FileExists "TASKS_QUICK_START.md" "Quick start guide"
Test-FileExists "TASKS_VISUAL_GUIDE.md" "Visual guide"

Write-Host ""

# Check UI components
Write-Host "Checking UI Components..." -ForegroundColor Yellow
$uiComponents = @(
    "button.tsx", "input.tsx", "badge.tsx", "avatar.tsx",
    "tooltip.tsx", "dialog.tsx", "dropdown-menu.tsx", "select.tsx",
    "textarea.tsx", "label.tsx", "checkbox.tsx"
)

foreach ($component in $uiComponents) {
    Test-FileExists "src\components\ui\$component" "UI: $component"
}

Write-Host ""

# Check dependencies in package.json
Write-Host "Checking Dependencies..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json

$requiredDeps = @{
    "@dnd-kit/core" = "^6.1.0"
    "@dnd-kit/sortable" = "^8.0.0"
    "@dnd-kit/utilities" = "^3.2.2"
    "framer-motion" = "*"
    "@tanstack/react-query" = "*"
    "date-fns" = "*"
}

foreach ($dep in $requiredDeps.Keys) {
    if ($packageJson.dependencies.$dep) {
        Write-Host "✓ Dependency: $dep ($($packageJson.dependencies.$dep))" -ForegroundColor Green
    } else {
        Write-Host "⚠ Dependency: $dep - NOT FOUND (expected: $($requiredDeps[$dep]))" -ForegroundColor Yellow
        $script:warnings++
    }
}

Write-Host ""

# Check file sizes
Write-Host "Checking File Sizes..." -ForegroundColor Yellow
$mainPage = Get-Item "src\app\tasks\page.tsx"
$mainPageLines = (Get-Content $mainPage.FullName | Measure-Object -Line).Lines
Write-Host "• Main page: $($mainPage.Length) bytes, $mainPageLines lines" -ForegroundColor Cyan

$mockData = Get-Item "src\lib\mock-tasks.ts"
$mockDataLines = (Get-Content $mockData.FullName | Measure-Object -Line).Lines
Write-Host "• Mock data: $($mockData.Length) bytes, $mockDataLines lines" -ForegroundColor Cyan

$types = Get-Item "src\types\tasks.ts"
$typesLines = (Get-Content $types.FullName | Measure-Object -Line).Lines
Write-Host "• Types: $($types.Length) bytes, $typesLines lines" -ForegroundColor Cyan

Write-Host ""

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "✓ All files present and accounted for!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run: pnpm install" -ForegroundColor White
    Write-Host "2. Run: pnpm dev" -ForegroundColor White
    Write-Host "3. Navigate to: http://localhost:3001/tasks" -ForegroundColor White
} elseif ($errors -eq 0) {
    Write-Host "✓ All required files present" -ForegroundColor Green
    Write-Host "⚠ $warnings warning(s) - check dependencies" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run: pnpm install (to install missing dependencies)" -ForegroundColor White
    Write-Host "2. Run: pnpm dev" -ForegroundColor White
    Write-Host "3. Navigate to: http://localhost:3001/tasks" -ForegroundColor White
} else {
    Write-Host "✗ $errors error(s) found" -ForegroundColor Red
    if ($warnings -gt 0) {
        Write-Host "⚠ $warnings warning(s) found" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Please ensure all files are in place before proceeding." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "For more information, see:" -ForegroundColor Cyan
Write-Host "• TASKS_QUICK_START.md - Quick start guide" -ForegroundColor White
Write-Host "• TASKS_FEATURE_SUMMARY.md - Complete feature guide" -ForegroundColor White
Write-Host "• TASKS_VISUAL_GUIDE.md - Visual guide and layouts" -ForegroundColor White
Write-Host "• src\app\tasks\README.md - Technical documentation" -ForegroundColor White

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
