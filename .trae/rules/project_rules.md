# Power Project Management — TRAE AI Skill

## Gambaran Umum Proyek

**Power Project Management (PPM)** adalah aplikasi manajemen proyek berbasis web yang terdiri dari dua bagian utama:

1. **Next.js Frontend** (root) — Dashboard admin statis berbasis template Fillow Bootstrap 5.
2. **Laravel Backend** (`laravel-app/`) — Aplikasi full-stack Laravel + Inertia.js dengan fitur lengkap.

---

## Struktur Direktori

```
/ (root — Next.js frontend)
├── app/
│   ├── page.tsx          # Halaman dashboard utama (single page, template Fillow)
│   ├── layout.tsx        # Root layout: memuat CSS Bootstrap, vendor JS, SettingsPanel
│   ├── SettingsPanel.tsx # Panel pengaturan tema (warna, layout, sidebar)
│   └── globals.css       # Global CSS
├── public/               # Aset statis HTML template, CSS, JS vendor, gambar
│   ├── css/              # Bootstrap & custom CSS (style.css)
│   ├── js/               # Custom JS (settings.js, custom.min.js, dashboard-1.js, dll)
│   ├── vendor/           # Vendor library: Bootstrap, ApexCharts, Chart.js, OWL Carousel, dll
│   └── images/           # Gambar aset
├── next.config.ts        # Konfigurasi Next.js
├── package.json          # Dependencies: Next.js 16, React 19, TypeScript, Tailwind CSS 4
└── tsconfig.json

laravel-app/ (Laravel + Inertia.js backend)
├── app/
│   ├── Http/Controllers/
│   │   ├── Tables/       # CRUD controllers: Projects, Partners, Users, TimeBoxing, dll
│   │   ├── Arrangement/  # Arrangement, Schedules, Batches, Pickups
│   │   ├── DashboardPartnersController.php
│   │   ├── OfficeAgentController.php
│   │   └── TelegramWebhookController.php
│   └── Models/           # Eloquent models: Project, Partner, User, TimeBoxing, Arrangement, dll
├── resources/js/Pages/   # Inertia.js React pages
│   ├── Dashboard/        # Halaman dashboard
│   ├── Projects/         # Manajemen proyek
│   ├── Contacts/         # Manajemen kontak
│   ├── Kanban/           # Board Kanban
│   ├── Calendar/         # Kalender
│   ├── Messages/         # Pesan
│   ├── Arrangement/      # Pengaturan arrangement
│   ├── Tables/           # Tabel data (Partners, Users, TimeBoxing, dll)
│   ├── OfficeAgent/      # Office AI agent
│   └── Profile/          # Profil user
├── routes/web.php        # 86+ route HTTP
├── database/migrations/  # Schema database
└── .trae/rules/          # Aturan TRAE untuk Laravel (lihat project_rules.md di sana)
```

---

## Stack Teknologi

### Frontend (Next.js)
- **Framework**: Next.js 16 dengan App Router
- **UI**: React 19, TypeScript
- **Styling**: Tailwind CSS 4, Bootstrap 5 (via CDN/public)
- **Charts**: ApexCharts, Chart.js, Peity
- **Carousel**: OWL Carousel
- **Template**: Fillow SaaS Admin Dashboard (Dexignlabs)

### Backend (Laravel)
- **Framework**: Laravel (PHP)
- **Frontend bridge**: Inertia.js + React/JSX
- **Auth**: Laravel Breeze/Sanctum + Spatie Roles & Permissions
- **Multi-tenant**: Dukungan `tenant_id` di tabel utama
- **Integrasi**: Telegram webhook, Office AI Agent
- **Database**: MySQL (tabel utama lihat di bawah)

---

## Database Tables (Laravel)

| Tabel | Deskripsi |
|---|---|
| `users` | Pengguna (dengan `tenant_id`, `is_internal`) |
| `tenants` | Data tenant/organisasi |
| `partners` | Data mitra/klien |
| `partner_setup_options` | Opsi konfigurasi partner |
| `projects` | Data proyek |
| `project_pic_assignments` | Penugasan PIC ke proyek |
| `project_setup_options` | Opsi konfigurasi proyek |
| `time_boxings` | Data time boxing |
| `time_boxing_setup_options` | Opsi konfigurasi time boxing |
| `arrangement_batches` | Batch pengaturan arrangement |
| `arrangement_schedules` | Jadwal arrangement |
| `arrangement_schedule_pickups` | Pickup untuk jadwal arrangement |
| `audit_logs` | Log audit aksi user |
| `security_events` | Event keamanan |
| `auth_events` | Event autentikasi |
| `office_agent_reports` | Laporan dari office AI agent |
| `release_notes` | Catatan rilis versi |
| `roles`, `permissions`, dll | Spatie RBAC |

---

## Navigasi Sidebar (Next.js Dashboard)

- **Dashboard**: `/` (halaman utama)
- **Project**: `project-page.html`
- **Contacts**: `contacts.html`
- **Kanban**: `kanban.html`
- **Calendar**: `calendar-page.html`
- **Messages**: `message.html`
- **CMS**: Content, Add Content, Menus, Email Template, Blog, Blog Category
- **Apps**: Profile, Edit Profile, Email (Compose/Inbox/Read), Calendar, Shop (E-commerce)
- **Charts**: Flot, Morris, Chartjs, Chartist, Sparkline, Peity
- **Bootstrap UI**: Accordion, Alert, Badge, Button, Modal, Card, Carousel, dll
- **Plugins**: Select2, Nestable, Noui Slider, Sweet Alert, Toastr, Map
- **Forms**: Form Elements, Wizard, CkEditor, Pickers, Validation
- **Tables**: Bootstrap, Datatable
- **Pages**: Login, Register, Error (400/403/404/500/503), Forgot Password, Lock Screen

---

## Konvensi Koding

### Next.js Frontend
- Gunakan TypeScript untuk semua komponen baru di `app/`
- Komponen React menggunakan `export default function ComponentName()`
- Class CSS mengikuti konvensi Bootstrap 5 (className, bukan class)
- Atribut `suppressHydrationWarning` pada elemen yang dikelola JS client-side
- Script vendor dimuat dengan `next/script` strategy `afterInteractive`
- Inline script dalam `<Script id="...">` menggunakan IIFE pattern

### Laravel Backend
- Controller mengikuti Resource Controller pattern
- Route dikelompokkan dengan `middleware(['auth', 'verified'])`
- Inertia render: `Inertia::render('FolderName/Page', [...data])`
- Model menggunakan Eloquent dengan soft deletes jika diperlukan
- Permission menggunakan Spatie: `middleware('role_or_permission:Administrator|...')`
- Multi-tenant: semua query utama harus memfilter berdasarkan `tenant_id`

### Modal Footer (dari aturan Laravel)
- Tombol aksi utama (Create/Update/Delete) di **kiri**
- Tombol Cancel/Close di **kanan**
- Kedua tombol dikelompokkan di sisi kanan footer

---

## Perintah Berguna

```bash
# Next.js (root)
npm run dev       # Jalankan dev server
npm run build     # Build production
npm run lint      # Linting ESLint

# Laravel (laravel-app/)
php artisan serve           # Jalankan dev server
php artisan migrate         # Jalankan migrasi
php artisan migrate:fresh   # Reset & jalankan ulang migrasi
composer install            # Install PHP dependencies
npm install && npm run dev  # Install & jalankan Vite (Inertia)
```

---

## Deployment

- **Docker**: Tersedia `Dockerfile`, `docker-compose.yml`, `docker-compose.prod.yml`
- **VPS**: Panduan di `DEPLOY_VPS_DOCKER.md`
- **Backup/Restore**: Script `backup.ps1` dan `restore.ps1`
- **Env**: Salin `.env.production.example` ke `.env` untuk produksi
