param(
    [string]$ProjectRoot = (Split-Path -Parent $MyInvocation.MyCommand.Path),
    [string]$Archive,
    [string]$Destination,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$projectRootFull = (Resolve-Path -LiteralPath $ProjectRoot).Path
$backupRoot = Join-Path $projectRootFull ".backups"

if ([string]::IsNullOrWhiteSpace($Archive)) {
    if (!(Test-Path -LiteralPath $backupRoot)) {
        throw "Backup folder not found: $backupRoot"
    }

    $latest = Get-ChildItem -LiteralPath $backupRoot -Filter "backup-*.tar.gz" -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (!$latest) {
        throw "No backup archive found in: $backupRoot"
    }
    $Archive = $latest.FullName
}

$archiveFull = (Resolve-Path -LiteralPath $Archive).Path

if ([string]::IsNullOrWhiteSpace($Destination)) {
    if (!(Test-Path -LiteralPath $backupRoot)) {
        New-Item -ItemType Directory -Path $backupRoot | Out-Null
    }
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $Destination = Join-Path $backupRoot "restore-$timestamp"
}

$destFull = $Destination
if (!(Test-Path -LiteralPath $destFull)) {
    New-Item -ItemType Directory -Path $destFull | Out-Null
} else {
    $existing = Get-ChildItem -LiteralPath $destFull -Force -ErrorAction SilentlyContinue
    if ($existing -and -not $Force) {
        throw "Destination is not empty: $destFull (use -Force to restore anyway)"
    }
}

tar -xzf $archiveFull -C $destFull

$required = @(
    "public\\index.html",
    "app\\page.tsx",
    "docker-compose.yml",
    "laravel-app\\artisan"
)

$missing = @()
foreach ($p in $required) {
    if (!(Test-Path -LiteralPath (Join-Path $destFull $p))) {
        $missing += $p
    }
}

if ($missing.Count -gt 0) {
    throw "Restore completed but missing expected files: $($missing -join ', ')"
}

[pscustomobject]@{
    archive = $archiveFull
    destination = $destFull
    sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $archiveFull).Hash
}
