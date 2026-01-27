# Script para hacer commit y push al repositorio
Write-Host "Iniciando proceso de Git..." -ForegroundColor Green

# Limpiar staging area
git reset

# Eliminar archivo nul si existe
if (Test-Path "nul") {
    Remove-Item "nul" -Force
    Write-Host "Archivo 'nul' eliminado" -ForegroundColor Yellow
}

# Añadir todos los archivos excepto nul
Get-ChildItem -Recurse -File | Where-Object { $_.Name -ne "nul" } | ForEach-Object {
    git add $_.FullName 2>$null
}

# Hacer commit
$commitMessage = "feat: Add 5 new backend modules (HR, Communications, Documents, Workflows, Leads) + fix tsconfig"
git commit -m $commitMessage

# Configurar remote si no existe
$remoteExists = git remote get-url origin 2>$null
if (-not $remoteExists) {
    Write-Host "Configurando remote origin..." -ForegroundColor Yellow
    git remote add origin https://github.com/ramakjama/AI-CORE.git
}

# Crear rama blackboxai
git checkout -b blackboxai/backend-modules-completion 2>$null

# Push
Write-Host "Haciendo push..." -ForegroundColor Green
git push -u origin blackboxai/backend-modules-completion --force

Write-Host "Proceso completado!" -ForegroundColor Green
