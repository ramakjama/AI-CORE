################################################################################
# PostgreSQL Backup Script (PowerShell)
# Automated backup for AIT-CORE PostgreSQL database on Windows
################################################################################

param(
    [string]$BackupDir = "C:\backup\postgres",
    [string]$DBHost = "localhost",
    [int]$DBPort = 5432,
    [string]$DBUser = "aitcore",
    [string]$DBName = "soriano_core",
    [string]$DBPassword = $env:POSTGRES_PASSWORD,
    [int]$RetentionDays = 30,
    [string]$S3Bucket = "",
    [string]$SlackWebhook = ""
)

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "postgres_${DBName}_${Timestamp}.sql.gz"
$LogFile = Join-Path $BackupDir "backup.log"

# Create backup directory
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# Logging function
function Write-Log {
    param([string]$Message)
    $LogMessage = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

# Notification function
function Send-Notification {
    param(
        [string]$Status,
        [string]$Message
    )

    if ($SlackWebhook) {
        try {
            $Body = @{
                text = "[$Status] PostgreSQL Backup: $Message"
            } | ConvertTo-Json

            Invoke-RestMethod -Uri $SlackWebhook -Method Post -Body $Body -ContentType 'application/json' | Out-Null
        } catch {
            Write-Log "Failed to send notification: $_"
        }
    }
}

try {
    Write-Log "Starting PostgreSQL backup for database: $DBName"

    # Check if pg_dump is available
    $pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
    if (-not $pgDump) {
        throw "pg_dump not found. Please ensure PostgreSQL client tools are installed and in PATH"
    }

    # Test PostgreSQL connection
    $env:PGPASSWORD = $DBPassword
    $testConnection = & pg_isready -h $DBHost -p $DBPort -U $DBUser 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL is not accessible at ${DBHost}:${DBPort}"
    }

    Write-Log "Creating backup: $BackupFile"

    # Create backup
    $backupPath = Join-Path $BackupDir $BackupFile
    $tempSqlFile = Join-Path $BackupDir "temp_${Timestamp}.sql"

    & pg_dump -h $DBHost -p $DBPort -U $DBUser -d $DBName `
        --format=plain --no-owner --no-acl --clean --if-exists `
        -f $tempSqlFile

    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }

    # Compress the backup
    if (Get-Command 7z -ErrorAction SilentlyContinue) {
        & 7z a -tgzip $backupPath $tempSqlFile | Out-Null
    } else {
        # Fallback to PowerShell compression
        Compress-Archive -Path $tempSqlFile -DestinationPath ($backupPath -replace '\.gz$', '.zip')
        $BackupFile = $BackupFile -replace '\.gz$', '.zip'
        $backupPath = $backupPath -replace '\.gz$', '.zip'
    }

    Remove-Item $tempSqlFile -Force

    # Verify backup file
    if (-not (Test-Path $backupPath) -or (Get-Item $backupPath).Length -eq 0) {
        throw "Backup file is empty or does not exist"
    }

    $backupSize = [math]::Round((Get-Item $backupPath).Length / 1MB, 2)
    Write-Log "Backup completed successfully. Size: ${backupSize}MB"

    # Create checksum
    $hash = Get-FileHash -Path $backupPath -Algorithm MD5
    $hash.Hash | Out-File -FilePath "${backupPath}.md5" -Encoding ASCII
    Write-Log "Checksum created: ${BackupFile}.md5"

    # Upload to S3 if configured
    if ($S3Bucket) {
        Write-Log "Uploading to S3: s3://${S3Bucket}/postgres/"
        aws s3 cp $backupPath "s3://${S3Bucket}/postgres/${BackupFile}" --storage-class STANDARD_IA
        aws s3 cp "${backupPath}.md5" "s3://${S3Bucket}/postgres/${BackupFile}.md5"
        Write-Log "S3 upload completed"
    }

    # Cleanup old backups
    Write-Log "Cleaning up backups older than $RetentionDays days"
    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $BackupDir -Filter "postgres_*.sql.*" |
        Where-Object { $_.LastWriteTime -lt $cutoffDate } |
        ForEach-Object {
            Write-Log "Deleting old backup: $($_.Name)"
            Remove-Item $_.FullName -Force
        }

    # Generate backup report
    $reportPath = Join-Path $BackupDir "backup_report_${Timestamp}.txt"
    @"
PostgreSQL Backup Report
========================
Date: $(Get-Date)
Database: $DBName
Host: ${DBHost}:${DBPort}
Backup File: $BackupFile
Size: ${backupSize}MB
Status: SUCCESS
Retention: $RetentionDays days
S3 Upload: $(if ($S3Bucket) { "Enabled" } else { "Disabled" })
"@ | Out-File -FilePath $reportPath -Encoding UTF8

    Write-Log "Backup process completed successfully"
    Send-Notification "SUCCESS" "PostgreSQL backup completed. Size: ${backupSize}MB"

    exit 0

} catch {
    $errorMessage = $_.Exception.Message
    Write-Log "ERROR: Backup failed - $errorMessage"
    Send-Notification "FAILED" "PostgreSQL backup failed: $errorMessage"
    exit 1
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
