# PowerShell script to create all marketing & sales module structures

$basePath = "C:\Users\rsori\codex\ait-core-soriano\modules\03-marketing-sales"

$modules = @(
    "ai-lead-generation",
    "ai-customer-journey",
    "ai-campaign-manager",
    "ai-conversion-optimizer",
    "ai-brand-manager",
    "ai-influencer-manager",
    "ai-loyalty-programs",
    "ai-referral-engine",
    "ai-pricing-optimizer"
)

foreach ($module in $modules) {
    $modulePath = Join-Path $basePath $module

    # Create directory structure
    New-Item -Path "$modulePath\src\services" -ItemType Directory -Force | Out-Null
    New-Item -Path "$modulePath\src\controllers" -ItemType Directory -Force | Out-Null
    New-Item -Path "$modulePath\src\entities" -ItemType Directory -Force | Out-Null
    New-Item -Path "$modulePath\src\dto" -ItemType Directory -Force | Out-Null
    New-Item -Path "$modulePath\src\interfaces" -ItemType Directory -Force | Out-Null

    Write-Host "Created structure for $module"
}

Write-Host "All module structures created successfully!"
