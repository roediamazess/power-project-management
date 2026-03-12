# Panduan Langkah demi Langkah Deploy ke VPS

Panduan **dari nol** sampai aplikasi Power Management jalan di VPS. Ikuti urutan di bawah. Ganti **IP_VPS_ANDA** dengan IP VPS Anda (domain bisa dipasang nanti lewat [VPS-DOMAIN.md](VPS-DOMAIN.md)).

---

## Langkah 1: Masuk ke VPS lewat SSH

Di komputer Anda (PowerShell atau terminal):

```bash
ssh root@IP_VPS_ANDA
```

Atau kalau pakai user (biasanya `ubuntu`):

```bash
ssh ubuntu@IP_VPS_ANDA
```

Masukkan password (atau pakai kunci SSH jika sudah diset). Setelah masuk, Anda akan di prompt seperti `root@vps:~#`.

---

## Langkah 2: Update sistem

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

Tunggu sampai selesai.

---

## Langkah 3: Pasang Docker dan Docker Compose

Jalankan perintah berikut **satu blok** (copy–paste):

```bash
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Cek Docker terpasang:

```bash
docker --version
docker compose version
```

Kalau pakai user (bukan root), tambahkan user ke grup docker lalu **logout dan login lagi** (atau jalankan `newgrp docker`):

```bash
sudo usermod -aG docker $USER
```

---

## Langkah 4: Bawa kode project ke VPS

Pilih **salah satu** cara.

### Opsi A: Pakai Git (repo sudah di GitHub/GitLab)

```bash
cd ~
git clone https://github.com_USERNAME/repo-power-schedule.git
cd repo-power-schedule
```

Ganti URL dengan URL repo Anda.

### Opsi B: Upload folder project dari PC ke VPS

Di **PC Anda** (PowerShell, dari folder yang berisi project):

```bash
scp -r c:\Website\power-schedule root@IP_VPS_ANDA:~/power-schedule
```

Lalu di VPS:

```bash
cd ~/power-schedule
```

---

## Langkah 5: Buat file .env di root project

Di VPS, pastikan Anda di folder project (misalnya `~/power-schedule` atau `~/repo-power-schedule`):

```bash
cp .env.example .env
nano .env
```

Isi seperti di bawah. **Ganti `IP_VPS_ANDA`** dengan IP atau domain VPS Anda, dan **ganti `password_kuat_anda`** dengan password yang aman:

```env
NEXT_PUBLIC_BACKEND_URL=http://IP_VPS_ANDA
POSTGRES_USER=admin
POSTGRES_PASSWORD=password_kuat_anda
POSTGRES_DB=schedule_db
```

Simpan: **Ctrl+O**, Enter, lalu **Ctrl+X**.

(Karena kita pakai nginx di port 80, pakai `http://IP_VPS_ANDA` tanpa `:8000`.)

---

## Langkah 6: Siapkan .env untuk backend Laravel

```bash
cp backend/.env.example backend/.env
```

Kita akan generate `APP_KEY` nanti setelah container pertama kali jalan. Untuk sekarang cukup sudah ada file `backend/.env`.

---

## Langkah 7: Build dan jalankan container

Masih di folder root project:

```bash
docker compose -f docker-compose.prod.yml build
```

Tunggu sampai selesai (beberapa menit). Lalu:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Cek semua service jalan:

```bash
docker compose -f docker-compose.prod.yml ps
```

Harus ada 4 container: **db**, **backend**, **frontend**, **nginx** dengan status **Up**.

---

## Langkah 8: Generate APP_KEY Laravel

Jalankan sekali saja:

```bash
docker compose -f docker-compose.prod.yml exec backend php artisan key:generate
```

Kalau diminta konfirmasi “overwrite”, ketik **yes** lalu Enter.

---

## Langkah 9: Buka firewall (port 22, 80)

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw enable
```

Ketika ditanya “Proceed with operation?”, ketik **y** lalu Enter.

```bash
sudo ufw status
```

Pastikan 22 dan 80 **ALLOW**.

---

## Langkah 10: Cek aplikasi di browser

Di komputer Anda, buka browser dan akses:

**http://IP_VPS_ANDA**

Ganti **IP_VPS_ANDA** dengan IP atau domain VPS Anda. Harus muncul halaman login Power Management. Coba login dengan **admin** / **admin123** atau **Komeng** / **pass123**.

---

## Jika ada masalah

- **Tidak bisa buka http://IP_VPS_ANDA**  
  - Cek firewall: `sudo ufw status`  
  - Cek container: `docker compose -f docker-compose.prod.yml ps` dan `docker compose -f docker-compose.prod.yml logs nginx`

- **Halaman muncul tapi API error / tidak bisa login**  
  - Cek `.env`: `NEXT_PUBLIC_BACKEND_URL` harus `http://IP_VPS_ANDA` (tanpa :8000) karena lewat nginx.  
  - Kalau Anda sudah ganti `.env` setelah build, wajib build ulang frontend:  
    `docker compose -f docker-compose.prod.yml build frontend --no-cache`  
    lalu `docker compose -f docker-compose.prod.yml up -d`

- **Container backend / frontend restart terus**  
  - Lihat log: `docker compose -f docker-compose.prod.yml logs backend` atau `logs frontend`

Setelah langkah 10 selesai, aplikasi sudah jalan di VPS dan siap dipakai.

---

## Pakai domain (bukan hanya IP)

Setelah Langkah 10 selesai dan aplikasi sudah bisa dibuka lewat IP, agar bisa akses lewat **powerpro.cloud** (dan opsional HTTPS), ikuti panduan **[VPS-DOMAIN.md](VPS-DOMAIN.md)** dari Langkah 1 di dokumen itu.
