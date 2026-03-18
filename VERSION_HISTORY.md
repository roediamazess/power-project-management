# Version History — Power Project Management

Format versi: `v1.YYMM.patch`

## v1.2603.1 — 2026-03-18

### Branding & UI

- Logo brand (ikon) diganti ke logo baru (4 lingkaran warna).
- Brand title diganti menjadi teks:
  - Normal: `Power Project Management`
  - Mode sidebar collapse: `PPM`
- Tombol settings (cog) di sidebar kanan dirapikan agar ikon rata tengah.

Referensi perubahan:
- Next (legacy): `app/page.tsx`
- Laravel/Inertia: `laravel-app/resources/js/Layouts/AuthenticatedLayout.jsx`
- CSS template: `public/css/style.css`, `laravel-app/public/css/style.css`

### Footer

- Footer diseragamkan dan dibuat rata tengah (2 baris):
  - `© 2026 — Where Insights Drive Action`
  - `v1.2603.1`

Referensi perubahan:
- Template static HTML: `public/*.html`
- Template untuk Laravel route `/template/...`: `laravel-app/resources/template-pages/*.html`
- Next (legacy): `app/page.tsx`
- Laravel/Inertia: `laravel-app/resources/js/Layouts/AuthenticatedLayout.jsx`

### Stabilitas & Fix

- Menghapus “hack replace footer” yang sebelumnya menyuntik teks via JS/CSS.
  - `public/js/dlabnav-init.js`
  - `public/css/style.css`
  - `laravel-app/public/js/dlabnav-init.js`
  - `laravel-app/public/css/style.css`
- Memperbaiki error Next dev (port 3000) yang menyebabkan halaman “muter-muter” (compile error `app/page.tsx`).
- Menstabilkan Next dev container di Windows dengan menambahkan volume `.next` (menghindari error lockfile).
  - `docker-compose.yml`

### Backup & Restore

- Menambahkan mekanisme backup tanpa menimpa backup lama (timestamped archive) + verifikasi restore.
- Menambahkan log backup SHA256.
- Menambahkan script:
  - `backup.ps1`
  - `restore.ps1`
- Menambahkan dokumentasi:
  - `.backups/README.md`
  - `.backups/backup-log.csv`

## Sebelum v1.2603.1 (baseline awal)

- Proyek berasal dari template admin “Fillow/DexignLab” (branding dan footer bawaan template).
- Struktur aplikasi:
  - Next.js (legacy UI/template) di root repo.
  - Laravel + Inertia (React) di folder `laravel-app/`.
