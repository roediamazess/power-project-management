#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TS="$(date +"%Y%m%d_%H%M%S")"
EXPORT_DIR="${ROOT_DIR}/exports/migrate_${TS}"
mkdir -p "$EXPORT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

echo "## [EXPORT] Root: ${ROOT_DIR}"
echo "## [EXPORT] Compose: ${COMPOSE_FILE}"
echo "## [EXPORT] Output: ${EXPORT_DIR}"

if [[ ! -f "${ROOT_DIR}/${COMPOSE_FILE}" ]]; then
  echo "ERROR: Compose file not found: ${ROOT_DIR}/${COMPOSE_FILE}"
  exit 1
fi

echo "## [1/5] Dumping database (PostgreSQL)... ##"
docker compose -f "${COMPOSE_FILE}" exec -T db sh -lc \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-privileges' \
  > "${EXPORT_DIR}/powerpro_pm.dump"

echo "## [2/5] Archiving storage (uploads/logs)... ##"
tar -czf "${EXPORT_DIR}/storage.tar.gz" \
  storage/app storage/app/public storage/logs 2>/dev/null || true

echo "## [3/5] Copying compose + env (PRIVATE)... ##"
cp -f "${ROOT_DIR}/${COMPOSE_FILE}" "${EXPORT_DIR}/${COMPOSE_FILE}"

if [[ -f "${ROOT_DIR}/.env" ]]; then
  cp -f "${ROOT_DIR}/.env" "${EXPORT_DIR}/.env.production"
fi

echo "## [4/5] Writing restore instructions... ##"
cat > "${EXPORT_DIR}/RESTORE_WINDOWS.md" <<'MD'
# Restore ke Docker Lokal (Windows)

Dokumen ini mengasumsikan folder lokal kamu:

- `C:\Website\powerpro-pm\laravel-app`

File yang dibutuhkan dari VPS:

- `powerpro_pm.dump`
- `storage.tar.gz`
- `.env.production` (BERISI SECRET, simpan private)
- `docker-compose.prod.yml`

## A. Copy file dari VPS ke Windows

Contoh (PowerShell):

```powershell
scp ubuntu@43.153.211.40:/path/to/laravel-app/exports/migrate_YYYYMMDD_HHMMSS/powerpro_pm.dump C:\Website\powerpro-pm\laravel-app\
scp ubuntu@43.153.211.40:/path/to/laravel-app/exports/migrate_YYYYMMDD_HHMMSS/storage.tar.gz C:\Website\powerpro-pm\laravel-app\
scp ubuntu@43.153.211.40:/path/to/laravel-app/exports/migrate_YYYYMMDD_HHMMSS/.env.production C:\Website\powerpro-pm\laravel-app\
```

## B. Jalankan container lokal

Pastikan Docker Desktop sudah jalan. Dari folder project:

```bash
docker compose up -d --build
```

## C. Restore database

Jika service db bernama `db`:

```bash
cat powerpro_pm.dump | docker compose exec -T db sh -lc 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-privileges'
```

## D. Restore storage

Extract di folder `laravel-app`:

Git Bash:

```bash
tar -xzf storage.tar.gz -C /c/Website/powerpro-pm/laravel-app
```

Lalu:

```bash
docker compose exec -T app sh -lc 'php artisan optimize:clear && php artisan migrate --force && php artisan storage:link || true'
```

## E. Verifikasi

- `http://localhost:8080/health` harus 200
- Login + cek Health Score
MD

echo "## [5/5] Done. Listing artifacts... ##"
ls -lah "${EXPORT_DIR}"

echo "## [SUCCESS] Export selesai: ${EXPORT_DIR}"

