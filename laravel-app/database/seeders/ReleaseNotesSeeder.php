<?php

namespace Database\Seeders;

use App\Models\ReleaseNote;
use Illuminate\Database\Seeder;

class ReleaseNotesSeeder extends Seeder
{
    public function run(): void
    {
        $notes = [
            [
                'version' => 'v1.2603.3',
                'released_on' => '2026-03-20',
                'data' => [
                    'sections' => [
                        [
                            'title' => 'Added',
                            'items' => [
                                'Tambahkan module `Projects` (CRUD) sejajar dengan Partners di sidebar.',
                                'Tambahkan `Tables > Project Setup` untuk mengelola option `Type` dan `Status` (Active/Inactive).',
                                'Tambahkan dukungan multi PIC per project dengan periode berbeda (table `project_pic_assignments`).',
                                'Tambahkan module `Time Boxing` (CRUD) sejajar dengan Partners/Projects di sidebar.',
                                'Tambahkan `Tables > Time Boxing Setup > Type` untuk mengelola option Type (Active/Inactive).',
                                'Tambahkan halaman `Audit Logs` (read-only) dengan filter Module/Action/Date/Search + view detail JSON.',
                                'Tambahkan tabel `audit_logs` untuk mencatat create/update/delete pada Projects/Partners/Setup/Time Boxing termasuk PIC assignments.',
                                'Tambahkan nomor otomatis untuk Projects agar ID tampil lebih simple di UI.',
                            ],
                            'references' => [
                                'Routes: `routes/web.php`',
                                'Projects UI: `resources/js/Pages/Tables/Projects/Index.jsx`',
                                'Project Setup UI: `resources/js/Pages/Tables/ProjectSetup/Index.jsx`',
                                'Projects controller: `app/Http/Controllers/Tables/ProjectsController.php`',
                                'Project Setup controller: `app/Http/Controllers/Tables/ProjectSetupController.php`',
                                'Migrations: `database/migrations/2026_03_19_000006_create_project_setup_options_table.php`, `2026_03_19_000007_create_projects_table.php`, `2026_03_20_000001_create_project_pic_assignments_table.php`',
                                'Audit Logs controller: `app/Http/Controllers/Tables/AuditLogsController.php`',
                                'Audit Logs UI: `resources/js/Pages/Tables/AuditLogs/Index.jsx`',
                                'Time Boxing controller: `app/Http/Controllers/Tables/TimeBoxingsController.php`',
                                'Time Boxing UI: `resources/js/Pages/Tables/TimeBoxing/Index.jsx`',
                                'Time Boxing Setup controller: `app/Http/Controllers/Tables/TimeBoxingSetupController.php`',
                                'Time Boxing Setup UI: `resources/js/Pages/Tables/TimeBoxingSetup/Index.jsx`',
                                'Audit model: `app/Models/AuditLog.php`',
                                'Migrations: `database/migrations/2026_03_20_000005_create_audit_logs_table.php`, `2026_03_20_000007_create_time_boxing_setup_options_table.php`, `2026_03_20_000008_create_time_boxings_table.php`, `2026_03_20_000010_add_no_to_projects_table.php`',
                            ],
                        ],
                        [
                            'title' => 'Fixed',
                            'items' => [
                                'Validasi backend: periode PIC tidak boleh di luar periode Project.',
                                'Validasi backend: jika PIC dipilih, Start/End pada baris PIC wajib diisi.',
                                'Audit trail: semua create/update/delete utama sekarang tercatat konsisten ke PostgreSQL (via transaksi).',
                                'Time Boxing: `completed_at` otomatis terisi saat status jadi Completed dan otomatis terhapus saat status berubah.',
                                'Time Boxing: perbaiki format datepicker agar tidak menghilangkan tahun pada input.',
                            ],
                            'references' => [
                                'Validation: `app/Http/Controllers/Tables/ProjectsController.php`',
                                'AuditLog model: `app/Models/AuditLog.php`',
                                'Time Boxing controller: `app/Http/Controllers/Tables/TimeBoxingsController.php`',
                                'Partner/Project Setup controllers: `app/Http/Controllers/Tables/PartnerSetupController.php`, `app/Http/Controllers/Tables/ProjectSetupController.php`',
                            ],
                        ],
                        [
                            'title' => 'Changed',
                            'items' => [
                                'Model data Projects: PIC utama bergeser menjadi ringkasan dari daftar PIC-periode (multi-PIC).',
                                'UI Projects: input PIC menjadi tabel baris dinamis (Add/Remove) agar history periode lebih jelas.',
                                'Dokumentasi perubahan dirapikan melalui `CHANGELOG.md`.',
                                'Sidebar: urutan menu dirapikan menjadi Partners, Projects, Time Boxing, Audit Logs.',
                                'UI Projects & Time Boxing: kolom ID ditampilkan sebagai nomor otomatis (bukan UUID).',
                                'UI Form Partners/Projects/Time Boxing: input tanggal distandarkan menjadi format `dd Mmm yy`.',
                                'UI Time Boxing: tambah filter harian (status/priority/type/partner/project).',
                                'Time Boxing: pagination + filter dijalankan server-side (lebih cepat untuk data besar).',
                                'UI Time Boxing: filter Info Date From/To memakai calendar picker (tidak perlu ketik manual).',
                                'UI Time Boxing: tampilan tanggal picker distandarkan `dd Mmm yy` (tahun tidak hilang).',
                                'UI Time Boxing: format Completed Date menjadi `dd Mmm yy - Day, hh:mm:ss`.
                            ],
                            'references' => [
                                'Projects UI: `resources/js/Pages/Tables/Projects/Index.jsx`',
                                'Changelog: `CHANGELOG.md`',
                                'Sidebar: `resources/js/Layouts/AuthenticatedLayout.jsx`',
                                'Date utils: `resources/js/utils/date.js`',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'version' => 'v1.2603.2',
                'released_on' => '2026-03-19',
                'data' => [
                    'sections' => [
                        [
                            'title' => 'Auth & Navigation',
                            'items' => [
                                'Fix post-login halaman blank pada flow Inertia (redirect/login).',
                                'Tambah fallback hard redirect setelah login sukses agar tidak perlu reload manual.',
                            ],
                            'references' => [
                                'Backend login: `app/Http/Controllers/Auth/AuthenticatedSessionController.php`',
                                'Frontend login: `resources/js/Pages/Auth/Login.jsx`',
                            ],
                        ],
                        [
                            'title' => 'User Management (Tables)',
                            'items' => [
                                'Tambah menu sidebar: `Tables > User Management`.',
                                'Buat halaman list user (langsung tampil) + modal `New/Edit`.',
                                'CRUD user: create & update via form modal (password optional saat edit).',
                                'Tampilkan kolom: ID, Name, Full Name, Email, Start Work, Birthday, Tier, Status, Role.',
                            ],
                            'references' => [
                                'Routes: `routes/web.php`',
                                'Controller: `app/Http/Controllers/Tables/UserManagementController.php`',
                                'UI Page: `resources/js/Pages/Tables/UserManagement/Index.jsx`',
                                'Sidebar: `resources/js/Layouts/AuthenticatedLayout.jsx`',
                            ],
                        ],
                        [
                            'title' => 'Schema & Data',
                            'items' => [
                                'Extend tabel `users`: `full_name`, `start_work`, `birthday`, `tier`, `status`.',
                                'Default status: `Active`.',
                                'Import data user PowerPro ke PostgreSQL (idempotent, match by email).',
                                'Set password awal semua user import: `pps88` (hashed), user bisa ganti sendiri.',
                            ],
                            'references' => [
                                'Migrations: `database/migrations/2026_03_19_000000_add_user_management_fields_to_users_table.php`',
                                'Migrations: `database/migrations/2026_03_19_000001_add_tier_status_to_users_table.php`',
                                'Seeder import: `database/seeders/PowerProUserImportSeeder.php`',
                                'Model: `app/Models/User.php`',
                            ],
                        ],
                        [
                            'title' => 'Roles & Access',
                            'items' => [
                                'Role options: `Administrator`, `Management`, `Admin Officer`, `User`, `Partner`.',
                                'Assign role ke user via Spatie Permission (syncRoles).',
                                'Seed roles default untuk memastikan opsi selalu tersedia.',
                            ],
                            'references' => [
                                'Seeder roles: `database/seeders/DatabaseSeeder.php`',
                                'Spatie config: `config/permission.php`',
                            ],
                        ],
                        [
                            'title' => 'UI/UX Consistency',
                            'items' => [
                                'Form create/edit dipindah ke modal agar list lebih clean.',
                                'Standarisasi urutan tombol modal: action (Create/Update/Delete) di kiri, Cancel di kanan.',
                                'Tambah Version History modal: versi di footer bisa diklik.',
                                'Tampilan Version History mengikuti theme (primary/body/card) dari settings gear.',
                            ],
                            'references' => [
                                'User modal: `resources/js/Pages/Tables/UserManagement/Index.jsx`',
                                'Profile delete modal: `resources/js/Pages/Profile/Partials/DeleteUserForm.jsx`',
                                'Project rules: `.trae/rules/project_rules.md`',
                                'Layout: `resources/js/Layouts/AuthenticatedLayout.jsx`',
                                'Theme settings: `public/js/settings.js`',
                                'Theme UI: `public/css/style.css`',
                            ],
                        ],
                        [
                            'title' => 'Deployment & Assets',
                            'items' => [
                                'Fix blank page saat reload `/dashboard` karena `public/build` tidak sinkron antara container app dan web.',
                                'Gunakan shared volume `public/build` agar manifest + assets selalu match.',
                            ],
                            'references' => [
                                'Compose: `docker-compose.prod.yml`',
                                'PHP image: `docker/php/Dockerfile`',
                                'Nginx image: `docker/nginx/Dockerfile`',
                                'Entrypoint sync: `docker/php/entrypoint.sh`',
                            ],
                        ],
                        [
                            'title' => 'Access Control (UI)',
                            'items' => [
                                'Pindahkan pengaturan permission role dari bawah halaman menjadi tombol `User Rights` (popup) di User Management.',
                            ],
                            'references' => [
                                'UI: `resources/js/Pages/Tables/UserManagement/Index.jsx`',
                            ],
                        ],
                        [
                            'title' => 'Smart Search',
                            'items' => [
                                'Search bar header sekarang memfilter data pada halaman aktif (bukan global), dan reset otomatis saat pindah page.',
                                'Implement filtering di User Management, Partners, dan Partner Setup.',
                            ],
                            'references' => [
                                'Layout: `resources/js/Layouts/AuthenticatedLayout.jsx`',
                                'User Mgmt: `resources/js/Pages/Tables/UserManagement/Index.jsx`',
                                'Partners: `resources/js/Pages/Tables/Partners/Index.jsx`',
                                'Partner Setup: `resources/js/Pages/Tables/PartnerSetup/Index.jsx`',
                            ],
                        ],
                        [
                            'title' => 'Partner Setup Rules',
                            'items' => [
                                'Tambah status `Active/Inactive` pada Partner Setup options (default: Active).',
                                'Dropdown setup di form Partners hanya menampilkan option `Active` (inactive tetap terlihat jika sudah terpilih, tapi disabled).',
                                'Cegah delete (dan ganti nama/category) option yang sudah dipakai data Partners; arahkan untuk set `Inactive` saja.',
                                'Fix error 500 Partner Setup: define `$usedValues` saat render list.',
                            ],
                            'references' => [
                                'Migration: `database/migrations/2026_03_19_000005_add_status_to_partner_setup_options_table.php`',
                                'Controller: `app/Http/Controllers/Tables/PartnerSetupController.php`',
                                'Controller: `app/Http/Controllers/Tables/PartnersController.php`',
                                'UI: `resources/js/Pages/Tables/PartnerSetup/Index.jsx`',
                                'UI: `resources/js/Pages/Tables/Partners/Index.jsx`',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'version' => 'v1.2603.1',
                'released_on' => '2026-03-18',
                'data' => [
                    'sections' => [
                        [
                            'title' => 'Branding & UI',
                            'items' => [
                                'Logo brand (ikon) diganti ke logo baru (4 lingkaran warna).',
                                'Brand title diganti menjadi teks:',
                                'Normal: `Power Project Management`',
                                'Mode sidebar collapse: `PPM`',
                                'Tombol settings (cog) di sidebar kanan dirapikan agar ikon rata tengah.',
                            ],
                            'references' => [
                                'Next (legacy): `app/page.tsx`',
                                'Laravel/Inertia: `laravel-app/resources/js/Layouts/AuthenticatedLayout.jsx`',
                                'CSS template: `public/css/style.css`, `laravel-app/public/css/style.css`',
                            ],
                        ],
                        [
                            'title' => 'Footer',
                            'items' => [
                                'Footer diseragamkan dan dibuat rata tengah (2 baris):',
                                '`© 2026 — Where Insights Drive Action`',
                                '`v1.2603.1`',
                            ],
                            'references' => [
                                'Template static HTML: `public/*.html`',
                                'Template untuk Laravel route `/template/...`: `laravel-app/resources/template-pages/*.html`',
                                'Next (legacy): `app/page.tsx`',
                                'Laravel/Inertia: `laravel-app/resources/js/Layouts/AuthenticatedLayout.jsx`',
                            ],
                        ],
                        [
                            'title' => 'Stabilitas & Fix',
                            'items' => [
                                'Menghapus “hack replace footer” yang sebelumnya menyuntik teks via JS/CSS.',
                                '`public/js/dlabnav-init.js`',
                                '`public/css/style.css`',
                                '`laravel-app/public/js/dlabnav-init.js`',
                                '`laravel-app/public/css/style.css`',
                                'Memperbaiki error Next dev (port 3000) yang menyebabkan halaman “muter-muter” (compile error `app/page.tsx`).',
                                'Menstabilkan Next dev container di Windows dengan menambahkan volume `.next` (menghindari error lockfile).',
                                '`docker-compose.yml`',
                            ],
                        ],
                        [
                            'title' => 'Backup & Restore',
                            'items' => [
                                'Menambahkan mekanisme backup tanpa menimpa backup lama (timestamped archive) + verifikasi restore.',
                                'Menambahkan log backup SHA256.',
                                'Menambahkan script:',
                                '`backup.ps1`',
                                '`restore.ps1`',
                                'Menambahkan dokumentasi:',
                                '`.backups/README.md`',
                                '`.backups/backup-log.csv`',
                            ],
                        ],
                        [
                            'title' => 'Bbaseline awal',
                            'items' => [
                                'Blueprint proyek berasal dari OpenClaw',
                                'Struktur aplikasi rekomendasi:',
                                'Next.js (legacy UI/template) di root repo.',
                                'Laravel + Inertia (React) di folder `laravel-app/`.',
                            ],
                        ],
                    ],
                ],
            ],
        ];

        foreach ($notes as $note) {
            ReleaseNote::query()->updateOrCreate(
                ['version' => $note['version']],
                ['released_on' => $note['released_on'], 'data' => $note['data']],
            );
        }
    }
}
