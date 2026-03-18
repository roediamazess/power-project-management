# Backup & Restore (sebelum migrasi ke Laravel + Inertia)

Backup dibuat dalam 2 bentuk:

1) Tag Git di GitHub (mudah restore kapan saja)
2) File `git bundle` (offline backup 1 file)

## 1) Restore dari GitHub Tag

Tag backup:

- `backup/pre-laravel-inertia-20260317-150516`

Langkah restore:

```bash
git clone https://github.com/roediamazess/power-project-management.git
cd power-project-management
git checkout backup/pre-laravel-inertia-20260317-150516
```

Jalankan (pilih salah satu):

```bash
npm install
npm run build
npm run start
```

atau via Docker production:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 2) Restore dari File Git Bundle (offline)

Lokasi backup bundle (Windows):

- `C:\Website\power-project-management-backups\power-project-management-20260317-150745.bundle`

Restore jadi repo baru:

```bash
mkdir restore-power-project-management
cd restore-power-project-management
git clone C:\Website\power-project-management-backups\power-project-management-20260317-150745.bundle .
git checkout backup/pre-laravel-inertia-20260317-150516
```

Lalu jalankan seperti di atas (npm atau docker).

