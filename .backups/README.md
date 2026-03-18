## Backup & Restore

### Lokasi

- Folder backup: `.backups/`
- Arsip backup: `backup-YYYYMMDD-HHMMSS.tar.gz`
- Log backup: `backup-log.csv`
- Script: `backup.ps1`, `restore.ps1`

### Backup yang dibuat

Backup dibuat tanpa menimpa backup sebelumnya (nama file pakai timestamp).

Exclude default:

- `.git/`
- `.backups/`
- `node_modules/` (semua level)
- `.next/` (semua level)
- `vendor/` (semua level)
- `laravel-app/public/build/`

### Restore (Windows / PowerShell)

```powershell
$src = "c:\Website\power-project-management\.backups\backup-YYYYMMDD-HHMMSS.tar.gz"
$dest = "D:\restore-website"
mkdir $dest
tar -xzf $src -C $dest
```

### Restore via script

```powershell
.\restore.ps1
```

Restore archive tertentu:

```powershell
.\restore.ps1 -Archive "c:\Website\power-project-management\.backups\backup-YYYYMMDD-HHMMSS.tar.gz" -Destination "D:\restore-website"
```

### Backup via script

```powershell
.\backup.ps1 -VerifyExclude
```

### Verifikasi cepat setelah restore

Pastikan file kunci ada:

- `public/index.html`
- `app/page.tsx`
- `docker-compose.yml`
- `laravel-app/artisan`
