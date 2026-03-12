# Deploy Power Management System ke VPS

Panduan singkat untuk menjalankan aplikasi di VPS (Ubuntu/Debian) dengan Docker.

---

## 1. Persyaratan VPS

- OS: Ubuntu 22.04 LTS atau Debian 12 (disarankan)
- RAM: minimal 1 GB (2 GB lebih nyaman)
- Docker & Docker Compose terpasang

---

## 2. Pasang Docker di VPS

```bash
# Update dan pasang dependensi
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Tambah repo Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Pasang Docker Engine + Compose
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
# Logout/login atau: newgrp docker
```

---

## 3. Clone project dan env

```bash
# Clone (ganti dengan URL repo Anda)
git clone https://github.com/ANDa/repo-power-schedule.git
cd repo-power-schedule

# Salin env dan edit
cp .env.example .env
nano .env
```

Isi `.env` minimal:

```env
# Ganti dengan URL yang diakses browser ke backend.
# Tanpa nginx (langsung port): http://IP_VPS_ANDA:8000
# Pakai nginx (port 80):      http://IP_VPS_ANDA
NEXT_PUBLIC_BACKEND_URL=http://IP_VPS_ANDA:8000

POSTGRES_USER=admin
POSTGRES_PASSWORD=password_kuat_anda
POSTGRES_DB=schedule_db
```

Backend Laravel butuh `APP_KEY`. Setelah **pertama kali** `up -d`:

```bash
# Generate APP_KEY (tersimpan ke backend/.env lewat volume)
docker compose -f docker-compose.prod.yml exec backend php artisan key:generate
```

Atau manual: copy `backend/.env.example` → `backend/.env`, isi `APP_KEY=base64:...` (random 32 byte), `APP_ENV=production`, `APP_DEBUG=false`, dan variabel `DB_*` sama dengan nilai PostgreSQL (user, password, database).

---

## 4. Build dan jalankan (production)

```bash
# Build image frontend (pakai NEXT_PUBLIC_BACKEND_URL dari .env)
docker compose -f docker-compose.prod.yml build

# Jalankan semua service (db, backend, frontend, nginx)
docker compose -f docker-compose.prod.yml up -d

# Cek status
docker compose -f docker-compose.prod.yml ps
```

Migrasi database jalan otomatis saat backend start.

---

## 5. Akses aplikasi

- **Pakai nginx (port 80):**  
  Buka di browser: `http://IP_VPS_ANDA`  
  Pastikan `.env`: `NEXT_PUBLIC_BACKEND_URL=http://IP_VPS_ANDA` (tanpa `:8000`), lalu **build ulang** frontend:
  ```bash
  docker compose -f docker-compose.prod.yml build frontend --no-cache
  docker compose -f docker-compose.prod.yml up -d
  ```

- **Tanpa nginx (langsung port):**  
  Buka: `http://IP_VPS_ANDA:3000` (frontend)  
  Pastikan `.env`: `NEXT_PUBLIC_BACKEND_URL=http://IP_VPS_ANDA:8000`

---

## 6. Firewall (ufw)

```bash
# Izinkan SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
# Jika tidak pakai nginx, buka juga 3000 dan 8000:
# sudo ufw allow 3000
# sudo ufw allow 8000
sudo ufw enable
sudo ufw status
```

---

## 7. Update setelah deploy

```bash
git pull
docker compose -f docker-compose.prod.yml build frontend backend
docker compose -f docker-compose.prod.yml up -d
```

---

## 8. Struktur stack production

| Service   | Port (host) | Keterangan                          |
|----------|-------------|-------------------------------------|
| db       | 5432        | PostgreSQL (bisa tidak diexpose)   |
| backend  | 8000        | Laravel API + migrasi otomatis     |
| frontend | 3000        | Next.js (production build)        |
| nginx    | 80          | Reverse proxy → frontend + /api    |

User awal (admin, Komeng, tim) ter-seed otomatis saat pertama kali akses data Schedule Arrangement.
