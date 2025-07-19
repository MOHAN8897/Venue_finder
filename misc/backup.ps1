# PowerShell Backup Script for Venue_finder
# Excludes node_modules and .git only

$projectRoot = Resolve-Path "$PSScriptRoot\.."
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupBase = "C:\Users\subha\OneDrive\Desktop\icon finder backup files"
$backupDir = Join-Path $backupBase "Venue_finder_snapshot_$timestamp"

Write-Host "Backing up project from $projectRoot to $backupDir..."

# Create backup directory if it doesn't exist
if (!(Test-Path $backupBase)) {
    New-Item -ItemType Directory -Path $backupBase | Out-Null
}

# Use robocopy for efficient copying, excluding node_modules and .git
robocopy $projectRoot $backupDir /E /XD node_modules .git

Write-Host "Backup complete: $backupDir" 