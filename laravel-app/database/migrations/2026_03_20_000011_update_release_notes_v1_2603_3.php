<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('release_notes')) {
            return;
        }

        $data = [
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
                        'Audit Logs controller: `app/Http/Controllers/Tables/AuditLogsController.php`',
                        'Audit Logs UI: `resources/js/Pages/Tables/AuditLogs/Index.jsx`',
                        'Time Boxing controller: `app/Http/Controllers/Tables/TimeBoxingsController.php`',
                        'Time Boxing UI: `resources/js/Pages/Tables/TimeBoxing/Index.jsx`',
                        'Time Boxing Setup controller: `app/Http/Controllers/Tables/TimeBoxingSetupController.php`',
                        'Time Boxing Setup UI: `resources/js/Pages/Tables/TimeBoxingSetup/Index.jsx`',
                        'Audit model: `app/Models/AuditLog.php`',
                        'Migrations: `database/migrations/2026_03_19_000006_create_project_setup_options_table.php`, `2026_03_19_000007_create_projects_table.php`, `2026_03_20_000001_create_project_pic_assignments_table.php`, `2026_03_20_000005_create_audit_logs_table.php`, `2026_03_20_000007_create_time_boxing_setup_options_table.php`, `2026_03_20_000008_create_time_boxings_table.php`, `2026_03_20_000010_add_no_to_projects_table.php`',
                    ],
                ],
                [
                    'title' => 'Fixed',
                    'items' => [
                        'Validasi backend: periode PIC tidak boleh di luar periode Project.',
                        'Validasi backend: jika PIC dipilih, Start/End pada baris PIC wajib diisi.',
                        'Audit trail: semua create/update/delete utama sekarang tercatat konsisten ke PostgreSQL (via transaksi).',
                        'Time Boxing: `completed_at` otomatis terisi saat status jadi Completed dan otomatis terhapus saat status berubah.',
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
                        'UI Time Boxing: format Completed Date menjadi `dd Mmm yy - Day, hh:mm:ss`.',
                    ],
                    'references' => [
                        'Projects UI: `resources/js/Pages/Tables/Projects/Index.jsx`',
                        'Changelog: `CHANGELOG.md`',
                        'Sidebar: `resources/js/Layouts/AuthenticatedLayout.jsx`',
                        'Date utils: `resources/js/utils/date.js`',
                    ],
                ],
            ],
        ];

        $now = now();

        $existing = DB::table('release_notes')->where('version', 'v1.2603.3')->first();

        if ($existing) {
            DB::table('release_notes')->where('version', 'v1.2603.3')->update([
                'released_on' => '2026-03-20',
                'data' => json_encode($data),
                'updated_at' => $now,
            ]);
        } else {
            DB::table('release_notes')->insert([
                'version' => 'v1.2603.3',
                'released_on' => '2026-03-20',
                'data' => json_encode($data),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        // no-op
    }
};
