param(
    [string]$VpsHost,
    [string]$VpsUser = "root",
    [string]$RemoteDir = "/opt/power-project-management",
    [string]$LocalDbDump = "db_dump.sql",
    [string]$LocalStorageArchive = "storage_data.tar.gz",
    [switch]$SkipDb,
    [switch]$SkipStorage
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($VpsHost)) {
    throw "VpsHost wajib diisi (contoh: 1.2.3.4)"
}

$here = (Resolve-Path -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Path)).Path
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $here "..")).Path
$laravelDir = Join-Path $repoRoot "laravel-app"

if (!(Test-Path -LiteralPath $laravelDir)) {
    throw "Folder laravel-app tidak ditemukan: $laravelDir"
}

$ssh = "$VpsUser@$VpsHost"

Write-Output "Upload source repo (tanpa .git/.backups/node_modules/.next/vendor/build) ke VPS: $ssh:$RemoteDir"
rsync -av --delete `
  --exclude ".git" --exclude ".backups" --exclude "**/node_modules" --exclude "**/.next" --exclude "**/vendor" --exclude "laravel-app/public/build" `
  "$repoRoot/" "$ssh:$RemoteDir/"

Write-Output "Build & up di VPS"
ssh $ssh "cd $RemoteDir/laravel-app && cp -n .env.vps.example .env || true && docker compose -f docker-compose.prod.yml up -d --build"

if (-not $SkipDb) {
    if (!(Test-Path -LiteralPath (Join-Path $repoRoot $LocalDbDump))) {
        throw "DB dump tidak ditemukan: $LocalDbDump"
    }
    Write-Output "Upload db dump: $LocalDbDump"
    scp (Join-Path $repoRoot $LocalDbDump) "$ssh:$RemoteDir/laravel-app/$LocalDbDump"
    Write-Output "Restore db dump di VPS"
    ssh $ssh "cd $RemoteDir/laravel-app && docker compose -f docker-compose.prod.yml exec -T db psql -U `"$env:DB_USERNAME`" -d `"$env:DB_DATABASE`" < $LocalDbDump"
}

if (-not $SkipStorage) {
    if (!(Test-Path -LiteralPath (Join-Path $repoRoot $LocalStorageArchive))) {
        throw "Storage archive tidak ditemukan: $LocalStorageArchive"
    }
    Write-Output "Upload storage archive: $LocalStorageArchive"
    scp (Join-Path $repoRoot $LocalStorageArchive) "$ssh:$RemoteDir/laravel-app/$LocalStorageArchive"
    Write-Output "Restore storage volume di VPS"
    ssh $ssh "cd $RemoteDir/laravel-app && docker run --rm -v laravel-app_storage_data:/data -v `"$RemoteDir/laravel-app`":/backup alpine sh -lc `"rm -rf /data/* && tar -xzf /backup/$LocalStorageArchive -C /data`""
}
