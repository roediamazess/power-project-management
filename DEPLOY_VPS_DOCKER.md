# Deploy ke VPS via Docker (Laravel + PostgreSQL)

Dokumen ini fokus untuk deploy aplikasi Laravel di folder `laravel-app/` menggunakan Docker Compose dan PostgreSQL.

## Prasyarat VPS

- Docker Engine + Docker Compose plugin (Compose v2)
- Port inbound:
  - `80/443` (kalau pakai reverse proxy HTTPS)
  - atau `8080` (langsung expose dari container `web`)
- DNS domain mengarah ke IP VPS (opsional tapi direkomendasikan)

## Struktur service (prod)

Menggunakan file:

- `laravel-app/docker-compose.prod.yml`

Service:

- `db`: PostgreSQL (data persisten di volume `pg_data`)
- `app`: PHP-FPM + Laravel (storage persisten di volume `storage_data`)
- `web`: Nginx (serve `/public` + proxy ke `app:9000`)

## Langkah deploy (fresh deploy)

1) Upload source code ke VPS

Opsi A: git clone

```bash
git clone <repo-url> power-project-management
cd power-project-management/laravel-app
```

Opsi B: upload arsip repo (scp/rsync) lalu extract.

2) Siapkan env untuk Compose

```bash
cp .env.vps.example .env
```

Edit nilai penting:

- `APP_URL` (pakai `https://domain.tld` bila di belakang reverse proxy)
- `APP_KEY` (isi di step berikut)
- `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `RUN_MIGRATIONS=1` (disarankan untuk deploy pertama)

3) Generate `APP_KEY`

Jika belum ada `APP_KEY`, buat key dulu lewat container:

```bash
docker compose -f docker-compose.prod.yml run --rm app php artisan key:generate --show
```

Copy outputnya ke `APP_KEY=` di file `.env`.

4) Build & start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

5) Cek status

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail 100 app
```

Aplikasi default expose di:

- `http://<IP-VPS>:8080`

## Migrasi data dari lokal ke VPS (DB + storage)

Lokasi data yang perlu dipindahkan:

- Database PostgreSQL (dump/restore)
- Volume storage Laravel (`storage_data`) untuk upload/file runtime

### 1) Dump database dari mesin lokal

Di mesin lokal (Windows/PowerShell):

```powershell
docker compose -f laravel-app\\docker-compose.local.yml exec -T db pg_dump -U app -d app > db_dump.sql
```

Catatan:

- Sesuaikan `-U` dan `-d` dengan env yang dipakai (`DB_USERNAME`, `DB_DATABASE`).

### 2) Restore database di VPS

Upload `db_dump.sql` ke VPS (scp/rsync), lalu:

```bash
cd power-project-management/laravel-app
docker compose -f docker-compose.prod.yml exec -T db psql -U "$DB_USERNAME" -d "$DB_DATABASE" < db_dump.sql
```

Jika shell kamu tidak otomatis meng-inject variable `.env`, pakai nilai literal:

```bash
docker compose -f docker-compose.prod.yml exec -T db psql -U app -d app < db_dump.sql
```

### 3) Backup & restore volume storage_data

Backup dari lokal:

```powershell
docker run --rm -v laravel-app_storage_data:/data -v ${PWD}:/backup alpine sh -lc "cd /data && tar -czf /backup/storage_data.tar.gz ."
```

Upload `storage_data.tar.gz` ke VPS, lalu restore:

```bash
cd power-project-management/laravel-app
docker run --rm -v laravel-app_storage_data:/data -v "$PWD":/backup alpine sh -lc "rm -rf /data/* && tar -xzf /backup/storage_data.tar.gz -C /data"
```

## Reverse proxy + HTTPS (opsional tapi direkomendasikan)

Pilihan sederhana:

- Jalankan container stack ini di port `8080`
- Pasang reverse proxy di VPS (Nginx/Caddy) untuk domain kamu yang meneruskan ke `http://127.0.0.1:8080`

## Backup rutin di VPS

Database:

```bash
docker compose -f laravel-app/docker-compose.prod.yml exec -T db pg_dump -U app -d app > pg_dump_$(date +%F).sql
```

Storage volume:

```bash
docker run --rm -v laravel-app_storage_data:/data -v "$PWD":/backup alpine sh -lc "cd /data && tar -czf /backup/storage_$(date +%F).tar.gz ."
```

## Rollback cepat

- Simpan `.env` dan arsip backup (`pg_dump.sql`, `storage_data.tar.gz`)
- Untuk rollback aplikasi (tanpa menghapus data):

```bash
cd power-project-management/laravel-app
docker compose -f docker-compose.prod.yml up -d --build
```

Jika perlu rollback data:

- Restore `pg_dump.sql` dan `storage_data.tar.gz` dari backup yang lebih lama.
