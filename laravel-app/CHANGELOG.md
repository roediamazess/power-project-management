# Changelog

## v1.2603.4 (2026-03-23)

### Added
- Tambah upload foto profile di halaman **Profile** dan tampilkan avatar di header/sidebar.
- Tambah kompresi foto di browser (resize + JPEG) sebelum upload agar ukuran hemat untuk website.
- Tambah import data Partners dari XLSX dan auto-link ke **Partner Setup** / **Project Setup**.
- Tambah filter status Partners: **Active | Freeze | Inactive | All Status** (default: Active).
- Tambah index full-text (GIN) untuk mempercepat search di **Audit Logs** (PostgreSQL).
- Tambah test coverage untuk akses halaman Tables (Admin) dan upload profile photo.

### Fixed
- Fix 403 permission untuk role **Administrator** pada halaman Tables (Time Boxing/Setup, Project Setup, dll).
- Fix 413 Request Entity Too Large saat upload photo dengan menyesuaikan limit Nginx.
- Fix pencarian Partners lintas halaman: search header sekarang melakukan server search (reset pagination).
- Fix parsing input tanggal `dd Mmm yy` pada perhitungan durasi di halaman Projects.
- Fix kompatibilitas migration saat test (SQLite) untuk operasi khusus PostgreSQL (sequence).

### Changed
- Standarisasi input tanggal diselesaikan agar seluruh halaman Tables memakai komponen global `DatePickerInput` (format `dd Mmm yy`).
- Time Boxing: filter Info Date tidak lagi bergantung pada datepicker jQuery; memakai komponen global.
- Akses Tables: pola middleware diperkuat sehingga Administrator tetap bisa akses meski permission belum tersinkron.
- Branding title distandarkan menjadi **Power Project Management** (tanpa `Dashboard` / `Laravel`).
- Partners: hapus Search (server) dan tombol Apply/Reset (search header sudah cukup).

---

## v1.2603.3 (2026-03-20)

### Added
- Tambah module **Projects** (CRUD) di sidebar sejajar Partners.
- Tambah **Tables > Project Setup** untuk option **Type** dan **Status** (Active/Inactive).
- Tambah dukungan multi **PIC per periode** per project (tabel `project_pic_assignments`).
- Tambah module **Time Boxing** (CRUD) di sidebar sejajar Partners/Projects.
- Tambah **Tables > Time Boxing Setup > Type** untuk mengelola option Type (Active/Inactive).
- Tambah halaman **Audit Logs** (read-only) dengan filter Module/Action/Date/Search + view detail JSON.
- Tambah tabel `audit_logs` untuk mencatat CRUD (Projects/Partners/Setup/Time Boxing) termasuk PIC assignments.
- Tambah kolom nomor otomatis untuk **Projects** dan tampilkan sebagai ID yang lebih simple.

### Fixed
- Validasi: periode PIC tidak boleh di luar periode Project.
- Validasi: jika PIC dipilih, Start/End pada baris PIC wajib diisi.
- Audit trail: semua create/update/delete utama sekarang tercatat konsisten ke PostgreSQL (via transaksi).
- Time Boxing: `completed_at` otomatis terisi saat status jadi Completed dan otomatis terhapus saat status berubah.
- Time Boxing: perbaiki format datepicker agar tidak menghilangkan tahun pada input.

### Changed
- Model Projects: PIC utama menjadi ringkasan dari daftar PIC-periode (multi-PIC).
- UI Projects: input PIC menjadi tabel baris dinamis (Add/Remove) untuk beberapa PIC.
- Sidebar: urutan menu dirapikan menjadi Partners, Projects, Time Boxing, Audit Logs.
- UI Projects & Time Boxing: kolom ID ditampilkan sebagai nomor otomatis (bukan UUID).
- UI Form Partners/Projects/Time Boxing: input tanggal distandarkan menjadi format `dd Mmm yy`.
- UI Time Boxing: tambah filter harian (status/priority/type/partner/project).
- Time Boxing: pagination + filter dijalankan server-side (lebih cepat untuk data besar).
- UI Time Boxing: filter Info Date From/To memakai calendar picker (tidak perlu ketik manual).
- UI Time Boxing: tampilan tanggal picker distandarkan `dd Mmm yy` (tahun tidak hilang).
- UI Time Boxing: format Completed Date menjadi `dd Mmm yy - Day, hh:mm:ss`.

---

## v1.2603.2 (2026-03-19)

### Deployment & Assets
- Fix blank page saat reload `/dashboard` karena `public/build` tidak sinkron antara container app dan web.
- Gunakan shared volume `public/build` agar manifest + assets selalu match.

### Access Control (UI)
- Pindahkan pengaturan permission role menjadi tombol `User Rights` (popup) di User Management.

### Smart Search
- Search bar header memfilter data pada halaman aktif (bukan global), dan reset otomatis saat pindah page.
- Implement filtering di User Management, Partners, dan Partner Setup.

### Partner Setup Rules
- Tambah status `Active/Inactive` pada Partner Setup options (default: Active).
- Dropdown setup di form Partners hanya menampilkan option `Active` (inactive tetap terlihat jika sudah terpilih, tapi disabled).
- Cegah delete (dan ganti nama/category) option yang sudah dipakai data Partners; arahkan untuk set `Inactive` saja.
- Fix error 500 Partner Setup: define `$usedValues` saat render list.

---

Catatan: versi aplikasi sekarang **v1.2603.4**.
