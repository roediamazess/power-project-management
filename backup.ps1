param(
    [string]$ProjectRoot = (Split-Path -Parent $MyInvocation.MyCommand.Path),
    [string]$BackupDirName = ".backups",
    [string]$Prefix = "backup",
    [switch]$VerifyExclude
)

$ErrorActionPreference = "Stop"

$projectRootFull = (Resolve-Path -LiteralPath $ProjectRoot).Path
$backupRoot = Join-Path $projectRootFull $BackupDirName

if (!(Test-Path -LiteralPath $backupRoot)) {
    New-Item -ItemType Directory -Path $backupRoot | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveName = "$Prefix-$timestamp.tar.gz"
$archivePath = Join-Path $backupRoot $archiveName

$excludePath = Join-Path $backupRoot "exclude.txt"
@"
.git
.backups
node_modules
node_modules/**
**/node_modules
**/node_modules/**
.next
.next/**
**/.next
**/.next/**
vendor
vendor/**
**/vendor
**/vendor/**
laravel-app/public/build
laravel-app/public/build/**
"@ | Out-File -Encoding ascii -FilePath $excludePath -Force

tar -czf $archivePath -X $excludePath -C $projectRootFull .

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $archivePath).Hash
$sizeBytes = (Get-Item -LiteralPath $archivePath).Length

$logPath = Join-Path $backupRoot "backup-log.csv"
if (!(Test-Path -LiteralPath $logPath)) {
    "timestamp,archive,size_bytes,sha256" | Out-File -FilePath $logPath -Encoding ascii
}

"$timestamp,$archiveName,$sizeBytes,$hash" | Out-File -Append -FilePath $logPath -Encoding ascii

if ($VerifyExclude) {
    $hasNodeOrNext = tar -tzf $archivePath | Select-String -Pattern '^\./(node_modules|\.next)/' -Quiet
    if ($hasNodeOrNext) {
        throw "Exclude failed: archive still contains node_modules or .next"
    }
}

[pscustomobject]@{
    archive = $archivePath
    sha256 = $hash
    size_bytes = $sizeBytes
    log = $logPath
    exclude = $excludePath
}
