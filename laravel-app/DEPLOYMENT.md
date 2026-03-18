# Deploy Laravel + Inertia ke VPS (Docker)

Dokumen ini untuk deploy aplikasi Laravel (folder `laravel-app/`) ke VPS via Docker Compose dengan PostgreSQL.

## 1) Siapkan `.env` untuk production

Copy:

```bash
cp .env.production.example .env
```

Isi minimal:

- `APP_KEY` (generate sekali)
- `APP_URL` (domain kamu)
- kredensial DB

Generate APP_KEY (di dalam folder `laravel-app`, via container):

```bash
docker compose -f docker-compose.prod.yml run --rm app php artisan key:generate --show
```

Ambil `APP_KEY=base64:...` lalu isi di `.env` production kamu.

## 2) Jalankan container production (Nginx + PHP-FPM + PostgreSQL)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Akses:

- http://IP_VPS:8080

Catatan:

- Database yang dipakai: PostgreSQL (`DB_CONNECTION=pgsql`, port `5432`)
- Data persisten:
  - volume `pg_data` (PostgreSQL)
  - volume `storage_data` (Laravel storage)

## 3) Update

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 4) Logs

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f web
```

## 5) Migrasi data dari lokal ke VPS (opsional)

### Dump database dari lokal

Di mesin lokal:

```bash
docker compose -f docker-compose.local.yml exec -T db pg_dump -U app -d app > db_dump.sql
```

Upload `db_dump.sql` ke VPS, lalu restore:

```bash
docker compose -f docker-compose.prod.yml exec -T db psql -U app -d app < db_dump.sql
```

Sesuaikan `app/app` dengan `DB_USERNAME` dan `DB_DATABASE` kamu.

### Backup & restore storage_data

Backup volume storage dari lokal:

```bash
docker run --rm -v laravel-app_storage_data:/data -v "$PWD":/backup alpine sh -lc "cd /data && tar -czf /backup/storage_data.tar.gz ."
```

Upload `storage_data.tar.gz` ke VPS, lalu restore:

```bash
docker run --rm -v laravel-app_storage_data:/data -v "$PWD":/backup alpine sh -lc "rm -rf /data/* && tar -xzf /backup/storage_data.tar.gz -C /data"
```

## 6) Backup rutin (opsional)

Backup DB:

```bash
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U app -d app > pg_dump_$(date +%F).sql
```

Backup storage:

```bash
docker run --rm -v laravel-app_storage_data:/data -v "$PWD":/backup alpine sh -lc "cd /data && tar -czf /backup/storage_$(date +%F).tar.gz ."
```

## 7) Rollback cepat (opsional)

- Rollback aplikasi (tanpa hapus data):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

- Rollback data: restore file dump DB dan arsip storage dari backup yang lebih lama.
