# Pakai Domain untuk Website (Power Management)

Agar website bisa diakses lewat **powerpro.cloud** (bukan hanya IP).

---

## Urutan dari awal (baca ini dulu)

Kalau Anda belum pernah deploy ke VPS, ikuti **urutan ini**:

| Urutan | Dokumen | Isi |
|--------|---------|-----|
| **1** | **[VPS-LANGKAH.md](VPS-LANGKAH.md)** | Dari nol: SSH ke VPS, pasang Docker, copy project, buat `.env`, build & jalankan container, buka firewall. Selesai ketika aplikasi sudah bisa dibuka lewat **http://IP_VPS_ANDA**. |
| **2** | **VPS-DOMAIN.md** (dokumen ini) | Arahkan domain **powerpro.cloud** ke IP VPS, update `.env`, build ulang frontend. Opsional: pasang HTTPS (SSL). |

**Jadi:** Mulai dari **VPS-LANGKAH.md** dulu. Setelah aplikasi jalan di IP, baru lanjut ke langkah-langkah di bawah ini.

---

## Yang perlu disiapkan

- **Domain** yang Anda punya. Contoh di panduan ini: **powerpro.cloud**.
- **IP VPS** yang sudah dipakai sekarang (contoh: `43.153.211.40`).

---

## Langkah 1: Arahkan domain ke IP VPS (DNS)

Di panel pengelola domain (GoDaddy, Namecheap, Niagahoster, Cloudflare, dll.):

1. Buka pengaturan **DNS** / **DNS Management** untuk domain Anda.
2. Tambah **record jenis A**:
   - **Name/Host:**  
     - Pakai **root domain** → isi `@` atau kosongkan (artinya `yourdomain.com`).  
     - Pakai **subdomain** → isi subdomain saja (misalnya `power` → `power.domain.com`). Untuk **powerpro.cloud** pakai `@` (root).
   - **Value/Points to:** `43.153.211.40` (ganti dengan IP VPS Anda).
   - **TTL:** 300 atau 3600 (default boleh).

3. Simpan. Tunggu propagasi DNS **5 menit–48 jam** (biasanya 10–30 menit).

**Cek DNS sudah mengarah ke VPS:**

```bash
# Di PC atau VPS (ganti dengan domain Anda)
ping powerpro.cloud
```

Harus muncul balasan dari IP VPS Anda.

---

## Langkah 2: Update .env di VPS pakai domain

Masuk VPS (SSH), lalu:

```bash
cd ~/power-schedule
nano .env
```

Ubah baris `NEXT_PUBLIC_BACKEND_URL` menjadi **domain** Anda (pakai `http://` dulu, HTTPS nanti):

```env
NEXT_PUBLIC_BACKEND_URL=http://powerpro.cloud
```

Simpan: **Ctrl+O**, Enter, **Ctrl+X**.

---

## Langkah 3: Build ulang frontend dan restart

URL backend “dibakar” saat build Next.js, jadi setelah ganti `.env` wajib build ulang frontend:

```bash
cd ~/power-schedule
sudo docker compose -f docker-compose.prod.yml build frontend --no-cache
sudo docker compose -f docker-compose.prod.yml up -d
```

---

## Langkah 4: Buka lewat domain

Di browser buka:

**http://powerpro.cloud**

Harus muncul halaman login Power Management. Coba login seperti biasa.

---

## Jika Langkah 4 error: "Can't reach this page" / ERR_CONNECTION_REFUSED

**Penting:** Anda pakai **powerpro.cloud** (tanpa www) atau **www.powerpro.cloud**? Keduanya bisa punya DNS berbeda. Pastikan Anda punya **A record untuk yang Anda buka di browser**.

### Cek 1: DNS untuk host yang Anda buka

Di PC (PowerShell) atau VPS:

```bash
# Cek powerpro.cloud (tanpa www) mengarah ke IP mana
nslookup powerpro.cloud
```

Pastikan **Address** yang keluar = **IP VPS Anda**. Kalau kosong atau beda, di panel domain tambah **A record**: Name **@**, Value **IP_VPS**.

Kalau Anda mau buka **www.powerpro.cloud**, cek juga:

```bash
nslookup www.powerpro.cloud
```

Dan di DNS harus ada A record: Name **www**, Value **IP_VPS**.

### Cek 2: Di VPS — container jalan dan port 80 terbuka

Jalankan di VPS:

```bash
cd ~/power-schedule
sudo docker compose -f docker-compose.prod.yml ps
```

Pastikan **nginx**, **frontend**, **backend**, **db** status **Up**. Kalau ada yang Exit, jalankan lagi:

```bash
sudo docker compose -f docker-compose.prod.yml up -d
```

Cek ada proses yang dengar port 80:

```bash
sudo ss -tlnp | grep :80
```

Harus ada baris dengan **:80** dan **nginx** atau **docker**. Kalau kosong, nginx tidak jalan — cek log:

```bash
sudo docker compose -f docker-compose.prod.yml logs nginx
```

### Cek 3: Firewall VPS (port 80)

```bash
sudo ufw status
```

Pastikan **80** ada dan status **ALLOW**. Kalau belum:

```bash
sudo ufw allow 80
sudo ufw reload
```

### Cek 4: Tes dari VPS sendiri

Di VPS:

```bash
curl -I http://localhost
```

Harus dapat balasan **HTTP/1.1 200** atau **302**. Kalau ini berhasil tapi dari browser tetap refused, kemungkinan firewall (ufw atau firewall di provider/cloud) memblok port 80 dari luar.

---

## Langkah 5 (opsional): HTTPS (SSL) dengan Let's Encrypt

Agar ada gembok “Secure” dan pakai **https://...**:

### 5.1 Pasang Certbot di VPS

```bash
sudo apt-get update
sudo apt-get install -y certbot
```

### 5.2 Ambil sertifikat SSL

Untuk domain **powerpro.cloud**:

```bash
sudo certbot certonly --standalone -d powerpro.cloud
```

Ikuti petunjuk (email, setuju terms). Sertifikat akan disimpan di `/etc/letsencrypt/live/powerpro.cloud/`.

### 5.3 Pakai Nginx dengan SSL

Di project sudah ada **`nginx/nginx-ssl.conf`** yang diset untuk **powerpro.cloud**. Tidak perlu ganti nama domain lagi.

**Urutan yang disarankan:**

1. Hentikan container dulu supaya port 80 kosong untuk certbot:
   ```bash
   sudo docker compose -f docker-compose.prod.yml down
   ```
2. Ambil sertifikat:
   ```bash
   sudo certbot certonly --standalone -d powerpro.cloud
   ```
3. Edit **docker-compose.prod.yml** pada bagian service **nginx**: ganti `nginx.conf` dengan `nginx-ssl.conf` dan tambah port 443 + volume cert:
   ```yaml
   nginx:
     image: nginx:alpine
     restart: unless-stopped
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./nginx/nginx-ssl.conf:/etc/nginx/conf.d/default.conf:ro
       - /etc/letsencrypt:/etc/letsencrypt:ro
     depends_on:
       - frontend
       - backend
   ```
4. Di `.env` set:
   ```env
   NEXT_PUBLIC_BACKEND_URL=https://powerpro.cloud
   ```
5. Build ulang frontend dan jalankan lagi:
   ```bash
   sudo docker compose -f docker-compose.prod.yml build frontend --no-cache
   sudo docker compose -f docker-compose.prod.yml up -d
   ```
6. Buka firewall 443:
   ```bash
   sudo ufw allow 443
   sudo ufw reload
   ```

Akses **https://powerpro.cloud**.

---

## Ringkasan

| Langkah | Yang dilakukan |
|--------|-----------------|
| 1 | DNS: A record domain → IP VPS |
| 2 | Di VPS: `.env` → `NEXT_PUBLIC_BACKEND_URL=http://powerpro.cloud` |
| 3 | Build ulang frontend + `up -d` |
| 4 | Buka http://powerpro.cloud di browser |
| 5 (opsional) | Certbot + Nginx SSL → https://powerpro.cloud |
