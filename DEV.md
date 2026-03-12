# Development – Cara Cepat Lihat Perubahan Tampilan

Agar setiap ubah kode frontend **langsung terlihat** tanpa restart Docker:

## Opsi 1: Frontend jalan di PC (paling cepat)

1. **Jalankan hanya backend + database di Docker:**
   ```powershell
   cd c:\Website\power-schedule
   docker compose up -d db backend
   ```
   (Jangan jalankan service `frontend` di Docker.)

2. **Jalankan frontend di PC:**
   ```powershell
   cd c:\Website\power-schedule\frontend
   npm install
   npm run dev
   ```

3. Buka **http://localhost:3000**.  
   Setiap Anda simpan file (misalnya di `SubmissionSchedule.tsx`), halaman akan **auto-refresh** tanpa restart apa pun.

---

## Opsi 2: Semua di Docker

Jika tetap pakai `docker compose up -d` (termasuk frontend), file watch sudah pakai polling.  
Kalau perubahan masih lambat, **refresh manual** di browser (F5) atau restart container frontend:

```powershell
docker compose restart frontend
```

---

## Migrasi / Deploy ke server baru

Semua konfigurasi dan kode sudah di dalam project (termasuk migrasi DB). Saat pindah server:

1. Copy seluruh folder project (atau clone repo) ke server.
2. Pastikan Docker & Docker Compose terpasang.
3. Jalankan:
   ```bash
   docker compose up -d
   ```
4. **Migrasi database** akan dijalankan otomatis setiap kali container backend start (termasuk pertama kali). Tidak perlu menjalankan `php artisan migrate` manual.
5. User awal (admin, Komeng, tim) akan ter-seed otomatis saat pertama kali akses **GET /api/schedule-arrangement/data**.

Tidak perlu setting ulang; cukup `docker compose up -d` lalu akses frontend (port 3000) dan backend (port 8000).

---

**Rekomendasi:** Pakai **Opsi 1** saat development supaya hot reload cepat; pakai full Docker untuk production atau deploy.
