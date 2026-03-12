# Copy Project ke VPS dengan WinSCP

Panduan singkat upload folder project dari PC Windows ke VPS memakai WinSCP.

---

## 1. Buka WinSCP dan login ke VPS

1. Jalankan **WinSCP**.
2. **New Session** (atau isi jika sudah ada session):
   - **File protocol:** SCP (atau SFTP).
   - **Host name:** IP VPS Anda (contoh: `103.xxx.xxx.xxx`).
   - **Port number:** `22`.
   - **User name:** `root` atau `ubuntu` (sesuai user VPS).
   - **Password:** password VPS Anda (atau pilih key file jika pakai SSH key).
3. Klik **Login**. Jika muncul peringatan host key, pilih **Yes**.

Setelah berhasil, jendela terbagi dua: **kiri = PC Anda**, **kanan = VPS**.

---

## 2. Di sisi kiri (PC): masuk ke folder project

- Di panel **kiri**, arahkan ke folder project di PC Anda, misalnya:
  ```
  C:\Website\power-schedule
  ```
- Klik sekali folder **power-schedule** (atau nama folder project Anda) supaya isi folder itu yang tampil di bawahnya.  
  Jangan “masuk” ke dalam folder dulu; yang penting Anda tahu letak **folder power-schedule** itu (folder yang isinya ada `frontend`, `backend`, `docker-compose.prod.yml`, dll).

---

## 3. Di sisi kanan (VPS): masuk ke folder tujuan

- Di panel **kanan**, pilih tujuan upload, biasanya home user, misalnya:
  - `root` → `/root`
  - `ubuntu` → `/home/ubuntu`
- Klik kanan di area kosong → **New** → **Directory**.
- Nama folder: `power-schedule` (atau nama lain, bebas).
- Enter. Sekarang ada folder `/root/power-schedule` atau `/home/ubuntu/power-schedule`.

---

## 4. Upload folder project

- Di panel **kiri**, pilih **folder** `power-schedule` (satu folder, bukan isi di dalamnya).
- **Drag & drop** folder itu ke panel **kanan** ke dalam folder `power-schedule` yang baru saja dibuat (atau ke `/root` / `/home/ubuntu` kalau mau langsung di situ).

Atau:

- Panel kiri: pilih folder **power-schedule**.
- Klik kanan → **Upload**.
- Di kotak dialog, pastikan **Destination directory** mengarah ke folder tujuan di VPS (misalnya `/root/power-schedule` atau `/home/ubuntu/power-schedule`).
- Klik **OK**.

WinSCP akan mengupload seluruh isi folder (frontend, backend, docker-compose, .env.example, dll). Tunggu sampai selesai.

---

## 5. Cek di VPS (lewat SSH atau WinSCP)

- **Lewat WinSCP:** Di panel kanan, masuk ke folder yang tadi jadi tujuan. Pastikan ada isi seperti:
  - `frontend`
  - `backend`
  - `docker-compose.prod.yml`
  - `docker-compose.yml`
  - `.env.example`
  - dll.

- **Lewat SSH:** Buka PuTTY/terminal, login ke VPS, lalu:
  ```bash
  cd ~/power-schedule
  ls -la
  ```
  Harus terlihat folder `frontend`, `backend`, dan file `docker-compose.prod.yml`.

---

## 6. Lanjut deploy di VPS

Setelah copy selesai, lanjutkan dari **Langkah 5** di **VPS-LANGKAH.md** (buat `.env`, siapkan backend, build & jalankan Docker).

---

## Jika muncul error "file does not exist" (misal `.spdx-laravel.json`)

- Pilih **Skip** atau **Skip all**. File seperti `.spdx-laravel.json` (generated, SPDX/license) tidak wajib di server; aplikasi tetap jalan.
- Jika mau, di WinSCP bisa set **exclude** untuk `**/.spdx*.json` agar tidak ikut transfer.

---

## Tips

- **Jangan upload folder `node_modules` dan `.next`** (besar dan tidak perlu di server). Di WinSCP: sebelum upload, bisa **exclude**:
  - `frontend/node_modules`
  - `frontend/.next`
  Atau hapus dulu di PC di dalam `frontend` (folder `node_modules` dan `.next`), baru upload; nanti di VPS Docker yang akan build ulang.
- Kalau sudah pernah upload dan cuma ganti beberapa file, bisa pakai **Synchronize** (menu Commands → Synchronize) biar hanya file yang berubah yang diupload.
